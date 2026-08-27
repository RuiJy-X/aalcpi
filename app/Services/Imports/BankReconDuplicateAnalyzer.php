<?php

namespace App\Services\Imports;

use App\Models\BankStatement;
use App\Models\InternalDisbursements;
use Carbon\Carbon;
use Illuminate\Support\Str;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;

class BankReconDuplicateAnalyzer
{
    /**
     * Analyze an uploaded spreadsheet file for internal disbursements or bank statements.
     *
     * @param  string  $filePath  Full or relative path to the spreadsheet
     * @param  string  $type  'internal' or 'bank'
     * @param  array<string, mixed>  $batchContext  ['date_issued' => ..., 'disbursement_week' => ..., 'bank_date' => ...]
     * @param  array<string, string>  $mapping  Column mapping [targetField => sourceHeader]
     * @return array<string, mixed>
     */
    public function analyze(
        string $filePath,
        string $type,
        array $batchContext,
        array $mapping = []
    ): array {
        if ($type === 'bank') {
            return $this->analyzeBankStatements($filePath, $batchContext, $mapping);
        }

        return $this->analyzeInternalDisbursements($filePath, $batchContext, $mapping);
    }

    /**
     * Analyze internal disbursements spreadsheet.
     */
    private function analyzeInternalDisbursements(
        string $filePath,
        array $batchContext,
        array $mapping = []
    ): array {
        $headingRow = 6;
        $dateIssued = $batchContext['date_issued'] ?? null;
        $disbursementWeek = isset($batchContext['disbursement_week']) ? (int) $batchContext['disbursement_week'] : null;

        $rows = $this->extractRowsWithHeaders($filePath, $headingRow);
        $headerKeys = $rows['headers'];
        $dataRows = $rows['data'];

        $totalRows = 0;
        $newRowsCount = 0;
        $exactDuplicatesCount = 0;
        $possibleDuplicatesCount = 0;
        $invalidRowsCount = 0;

        $possibleDuplicates = [];
        $newRowsSample = [];
        $exactDuplicatesSample = [];
        $invalidRows = [];

        // Track seen check numbers within current batch to handle intra-file duplicates
        $seenInBatch = [];

        foreach ($dataRows as $index => $rawRow) {
            $rowNum = $index + $headingRow + 1;

            $hasAnyContent = false;
            foreach ($rawRow as $val) {
                if ($val !== null && trim((string) $val) !== '') {
                    $hasAnyContent = true;
                    break;
                }
            }

            if (! $hasAnyContent) {
                continue;
            }

            $rowMapped = $this->applyMapping($rawRow, $mapping);

            // 1. Validate required identifier
            $rawCheckNo = $rowMapped['check_no'] ?? $rowMapped['check_no.'] ?? '';
            $rawAuditNo = $rowMapped['audit_no'] ?? null;
            $rawAmount = $rowMapped['check_amount'] ?? null;

            $checkNo = trim((string) $rawCheckNo);
            $auditNo = $rawAuditNo !== null && trim((string) $rawAuditNo) !== '' ? trim((string) $rawAuditNo) : null;

            if ($checkNo === '' && $auditNo === null) {
                $invalidRowsCount++;
                $invalidRows[] = [
                    'row_number' => $rowNum,
                    'reason' => 'Check Number and Audit Number are both empty.',
                ];
                continue;
            }

            $checkAmountClean = str_replace([',', ' '], '', (string) $rawAmount);
            if ($rawAmount === null || $rawAmount === '' || ! is_numeric($checkAmountClean)) {
                $invalidRowsCount++;
                $invalidRows[] = [
                    'row_number' => $rowNum,
                    'reason' => "Invalid or non-numeric check amount: '{$rawAmount}'.",
                ];
                continue;
            }

            $checkAmount = round((float) $checkAmountClean, 2);
            $payeeName = trim((string) ($rowMapped['payee_name'] ?? 'Unknown Payee'));

            $dateReturn = null;
            if (! empty($rowMapped['date_return'])) {
                $dateReturn = is_numeric($rowMapped['date_return'])
                    ? ExcelDate::excelToDateTimeObject($rowMapped['date_return'])->format('Y-m-d')
                    : date('Y-m-d', strtotime($rowMapped['date_return']));
            }

            $totalRows++;
            $rowIdentifierKey = $checkNo !== '' ? $checkNo : ('audit:'.$auditNo);
            $rowId = 'row_'.$rowNum;

            $importedRecord = [
                'row_id' => $rowId,
                'row_number' => $rowNum,
                'check_no' => $checkNo,
                'audit_no' => $auditNo,
                'payee_name' => $payeeName,
                'check_amount' => $checkAmount,
                'date_issued' => $dateIssued,
                'disbursement_week' => $disbursementWeek,
                'date_return' => $dateReturn,
            ];

            // Check against existing database records
            $existingQuery = InternalDisbursements::query();
            if ($checkNo !== '') {
                $normalizedCheckNo = ltrim($checkNo, '0');
                $existingQuery->where(function ($q) use ($checkNo, $normalizedCheckNo) {
                    $q->where('check_no', $checkNo);
                    if ($normalizedCheckNo !== '') {
                        $q->orWhere('check_no', $normalizedCheckNo);
                    }
                });
            } else {
                $existingQuery->where('audit_no', $auditNo);
            }

            $existingMatches = $existingQuery->get();

            // Check if any existing record is an EXACT duplicate
            $exactMatch = $existingMatches->first(function (InternalDisbursements $existing) use (
                $checkNo,
                $checkAmount,
                $payeeName,
                $dateIssued,
                $disbursementWeek,
                $auditNo
            ) {
                $checkMatch = trim((string) $existing->check_no) === $checkNo ||
                    (ltrim($existing->check_no, '0') !== '' && ltrim($existing->check_no, '0') === ltrim($checkNo, '0'));
                $amountMatch = abs((float) $existing->check_amount - $checkAmount) < 0.01;
                $payeeMatch = strcasecmp(trim((string) $existing->payee_name), $payeeName) === 0;

                // Dates & weeks matching
                $dateMatch = true;
                if ($dateIssued && $existing->date_issued) {
                    $dateMatch = Carbon::parse($existing->date_issued)->format('Y-m-d') === Carbon::parse($dateIssued)->format('Y-m-d');
                }

                $weekMatch = true;
                if ($disbursementWeek !== null && $existing->disbursement_week !== null) {
                    $weekMatch = (int) $existing->disbursement_week === (int) $disbursementWeek;
                }

                $auditMatch = true;
                if ($auditNo !== null && $existing->audit_no !== null) {
                    $auditMatch = trim((string) $existing->audit_no) === $auditNo;
                }

                return $checkMatch && $amountMatch && $payeeMatch && $dateMatch && $weekMatch && $auditMatch;
            });

            // Also check intra-batch exact duplicates
            $intraBatchExact = isset($seenInBatch[$rowIdentifierKey]) &&
                abs($seenInBatch[$rowIdentifierKey]['check_amount'] - $checkAmount) < 0.01 &&
                strcasecmp($seenInBatch[$rowIdentifierKey]['payee_name'], $payeeName) === 0;

            if ($exactMatch || $intraBatchExact) {
                $exactDuplicatesCount++;
                if (count($exactDuplicatesSample) < 5) {
                    $exactDuplicatesSample[] = [
                        'row_number' => $rowNum,
                        'check_no' => $checkNo,
                        'payee_name' => $payeeName,
                        'check_amount' => $checkAmount,
                        'matched_existing_id' => $exactMatch?->id,
                        'matched_prior_row' => $intraBatchExact ? ($seenInBatch[$rowIdentifierKey]['row_number'] ?? null) : null,
                    ];
                }
                $seenInBatch[$rowIdentifierKey] = $importedRecord;
                continue;
            }

            // Check if it is a POSSIBLE duplicate (identifier matches, but fields differ)
            if ($existingMatches->isNotEmpty() || isset($seenInBatch[$rowIdentifierKey])) {
                $possibleDuplicatesCount++;
                $bestExisting = $existingMatches->first();

                $differences = [];
                if ($bestExisting) {
                    if (abs((float) $bestExisting->check_amount - $checkAmount) >= 0.01) {
                        $differences[] = [
                            'field' => 'check_amount',
                            'label' => 'Check Amount',
                            'existing' => number_format((float) $bestExisting->check_amount, 2),
                            'imported' => number_format($checkAmount, 2),
                        ];
                    }
                    if (strcasecmp(trim((string) $bestExisting->payee_name), $payeeName) !== 0) {
                        $differences[] = [
                            'field' => 'payee_name',
                            'label' => 'Payee Name',
                            'existing' => $bestExisting->payee_name,
                            'imported' => $payeeName,
                        ];
                    }
                    if ($dateIssued && $bestExisting->date_issued && Carbon::parse($bestExisting->date_issued)->format('Y-m-d') !== Carbon::parse($dateIssued)->format('Y-m-d')) {
                        $differences[] = [
                            'field' => 'date_issued',
                            'label' => 'Date Issued',
                            'existing' => Carbon::parse($bestExisting->date_issued)->format('Y-m-d'),
                            'imported' => Carbon::parse($dateIssued)->format('Y-m-d'),
                        ];
                    }
                    if ($disbursementWeek !== null && $bestExisting->disbursement_week !== null && (int) $bestExisting->disbursement_week !== (int) $disbursementWeek) {
                        $differences[] = [
                            'field' => 'disbursement_week',
                            'label' => 'Disbursement Week',
                            'existing' => 'Week '.$bestExisting->disbursement_week,
                            'imported' => 'Week '.$disbursementWeek,
                        ];
                    }
                    if ($auditNo !== null && $bestExisting->audit_no !== null && trim((string) $bestExisting->audit_no) !== $auditNo) {
                        $differences[] = [
                            'field' => 'audit_no',
                            'label' => 'Audit Number',
                            'existing' => $bestExisting->audit_no,
                            'imported' => $auditNo,
                        ];
                    }
                } else {
                    // Intra-batch possible duplicate
                    $prior = $seenInBatch[$rowIdentifierKey];
                    if (abs($prior['check_amount'] - $checkAmount) >= 0.01) {
                        $differences[] = [
                            'field' => 'check_amount',
                            'label' => 'Check Amount (Prior row in file)',
                            'existing' => number_format($prior['check_amount'], 2),
                            'imported' => number_format($checkAmount, 2),
                        ];
                    }
                    if (strcasecmp($prior['payee_name'], $payeeName) !== 0) {
                        $differences[] = [
                            'field' => 'payee_name',
                            'label' => 'Payee Name (Prior row in file)',
                            'existing' => $prior['payee_name'],
                            'imported' => $payeeName,
                        ];
                    }
                }

                $possibleDuplicates[] = [
                    'row_id' => $rowId,
                    'row_number' => $rowNum,
                    'identifier' => $checkNo !== '' ? $checkNo : ('Audit: '.$auditNo),
                    'existing_id' => $bestExisting?->id,
                    'existing_record' => $bestExisting ? [
                        'id' => $bestExisting->id,
                        'check_no' => $bestExisting->check_no,
                        'audit_no' => $bestExisting->audit_no,
                        'payee_name' => $bestExisting->payee_name,
                        'check_amount' => (float) $bestExisting->check_amount,
                        'date_issued' => $bestExisting->date_issued ? Carbon::parse($bestExisting->date_issued)->format('Y-m-d') : null,
                        'disbursement_week' => $bestExisting->disbursement_week,
                        'date_return' => $bestExisting->date_return ? Carbon::parse($bestExisting->date_return)->format('Y-m-d') : null,
                        'status' => $bestExisting->status,
                    ] : null,
                    'imported_record' => $importedRecord,
                    'differences' => $differences,
                    'default_action' => 'update',
                ];

                $seenInBatch[$rowIdentifierKey] = $importedRecord;
                continue;
            }

            // Otherwise, it is a BRAND NEW record
            $newRowsCount++;
            if (count($newRowsSample) < 5) {
                $newRowsSample[] = [
                    'row_number' => $rowNum,
                    'check_no' => $checkNo,
                    'payee_name' => $payeeName,
                    'check_amount' => $checkAmount,
                ];
            }
            $seenInBatch[$rowIdentifierKey] = $importedRecord;
        }

        return [
            'heading_row' => $headingRow,
            'headers_read' => $headerKeys,
            'total_rows' => $totalRows + $invalidRowsCount,
            'new_rows_count' => $newRowsCount,
            'exact_duplicates_count' => $exactDuplicatesCount,
            'possible_duplicates_count' => $possibleDuplicatesCount,
            'invalid_rows_count' => $invalidRowsCount,
            'possible_duplicates' => $possibleDuplicates,
            'new_rows_sample' => $newRowsSample,
            'exact_duplicates_sample' => $exactDuplicatesSample,
            'invalid_rows' => $invalidRows,
            'batch_context' => $batchContext,
        ];
    }

    /**
     * Analyze bank statements spreadsheet.
     */
    private function analyzeBankStatements(
        string $filePath,
        array $batchContext,
        array $mapping = []
    ): array {
        $headingRow = 1;
        $bankDate = $batchContext['bank_date'] ?? null;

        $rows = $this->extractRowsWithHeaders($filePath, $headingRow);
        $headerKeys = $rows['headers'];
        $dataRows = $rows['data'];

        $totalRows = 0;
        $newRowsCount = 0;
        $exactDuplicatesCount = 0;
        $possibleDuplicatesCount = 0;
        $invalidRowsCount = 0;

        $possibleDuplicates = [];
        $newRowsSample = [];
        $exactDuplicatesSample = [];
        $invalidRows = [];

        $seenInBatch = [];

        $toNum = function ($val) {
            if ($val === null || $val === '') {
                return null;
            }
            $cleanVal = str_replace([',', ' '], '', trim((string) $val));

            return is_numeric($cleanVal) ? (float) $cleanVal : null;
        };

        foreach ($dataRows as $index => $rawRow) {
            $rowNum = $index + $headingRow + 1;

            $hasAnyContent = false;
            foreach ($rawRow as $val) {
                if ($val !== null && trim((string) $val) !== '') {
                    $hasAnyContent = true;
                    break;
                }
            }

            if (! $hasAnyContent) {
                continue;
            }

            $rowMapped = $this->applyMapping($rawRow, $mapping);

            $rawDate = trim((string) ($rowMapped['tdate'] ?? ''));
            $rawBalance = $rowMapped['running_balance'] ?? null;
            $hasBalance = $rawBalance !== null && $rawBalance !== '';

            if ($rawDate === '' && ! $hasBalance) {
                $invalidRowsCount++;
                $invalidRows[] = [
                    'row_number' => $rowNum,
                    'reason' => 'Empty row (missing transaction date and balance).',
                ];
                continue;
            }

            if ($rawDate === '') {
                $invalidRowsCount++;
                $invalidRows[] = [
                    'row_number' => $rowNum,
                    'reason' => 'Missing transaction date.',
                ];
                continue;
            }

            $parsedDate = null;
            if (is_numeric($rawDate)) {
                $parsedDate = ExcelDate::excelToDateTimeObject($rawDate)->format('Y-m-d');
            } else {
                $dateObj = \DateTime::createFromFormat('m/d/Y', $rawDate);
                if ($dateObj) {
                    $parsedDate = $dateObj->format('Y-m-d');
                } else {
                    $fallback = strtotime($rawDate);
                    if ($fallback === false) {
                        $invalidRowsCount++;
                        $invalidRows[] = [
                            'row_number' => $rowNum,
                            'reason' => "Unparseable date format '{$rawDate}'.",
                        ];
                        continue;
                    }
                    $parsedDate = date('Y-m-d', $fallback);
                }
            }

            $checkno = ! empty($rowMapped['checkno']) ? trim((string) $rowMapped['checkno']) : null;
            $debit = $toNum($rowMapped['debit'] ?? null);
            $credit = $toNum($rowMapped['credit'] ?? null);
            $runningBalance = $toNum($rawBalance) ?? 0.00;
            $branchDesc = $rowMapped['branch_description'] ?? null;
            $partic = $rowMapped['partic'] ?? null;
            $currency = $rowMapped['currency'] ?? 'PHP';

            $totalRows++;
            $rowId = 'row_'.$rowNum;

            $importedRecord = [
                'row_id' => $rowId,
                'row_number' => $rowNum,
                'tdate' => $parsedDate,
                'checkno' => $checkno,
                'debit' => $debit,
                'credit' => $credit,
                'running_balance' => $runningBalance,
                'branch_description' => $branchDesc,
                'partic' => $partic,
                'currency' => $currency,
                'bank_date' => $bankDate,
            ];

            // Build match signature for intra-batch and database checks
            $signatureKey = $checkno
                ? sprintf('chk:%s:%.2f:%s:%.2f', $checkno, (float) ($debit ?? 0), $parsedDate, (float) $runningBalance)
                : sprintf('txn:%s:%.2f:%.2f:%.2f', $parsedDate, (float) ($debit ?? 0), (float) ($credit ?? 0), (float) $runningBalance);

            // Database Candidate Query
            $existingQuery = BankStatement::query();
            if ($checkno) {
                $cleanCheckNo = trim($checkno);
                $normalized = ltrim($cleanCheckNo, '0');
                $existingQuery->where(function ($q) use ($cleanCheckNo, $normalized) {
                    $q->where('checkno', $cleanCheckNo);
                    if ($normalized !== '') {
                        $q->orWhere('checkno', $normalized);
                    }
                });
            } else {
                $existingQuery->where('tdate', $parsedDate)
                    ->where('running_balance', $runningBalance);
                if ($debit !== null) {
                    $existingQuery->where('debit', $debit);
                }
                if ($credit !== null) {
                    $existingQuery->where('credit', $credit);
                }
            }

            $existingMatches = $existingQuery->get();

            // Exact match check
            $exactMatch = $existingMatches->first(function (BankStatement $existing) use (
                $checkno,
                $parsedDate,
                $debit,
                $credit,
                $runningBalance,
                $partic
            ) {
                $dateMatch = Carbon::parse($existing->tdate)->format('Y-m-d') === $parsedDate;
                $balanceMatch = abs((float) $existing->running_balance - $runningBalance) < 0.001;

                if ($checkno) {
                    $checkMatch = trim((string) $existing->checkno) === $checkno ||
                        (ltrim($existing->checkno, '0') !== '' && ltrim($existing->checkno, '0') === ltrim($checkno, '0'));
                    $debitMatch = ($debit === null && $existing->debit === null) ||
                        ($debit !== null && $existing->debit !== null && abs((float) $existing->debit - $debit) < 0.01);

                    return $checkMatch && $dateMatch && $debitMatch && $balanceMatch;
                }

                $amountMatch = true;
                if ($debit !== null) {
                    $amountMatch = $existing->debit !== null && abs((float) $existing->debit - $debit) < 0.01;
                } elseif ($credit !== null) {
                    $amountMatch = $existing->credit !== null && abs((float) $existing->credit - $credit) < 0.01;
                }

                $particMatch = true;
                if ($partic !== null && $existing->partic !== null) {
                    $particMatch = strcasecmp(trim((string) $existing->partic), trim((string) $partic)) === 0;
                }

                return $dateMatch && $balanceMatch && $amountMatch && $particMatch;
            });

            if ($exactMatch || isset($seenInBatch[$signatureKey])) {
                $exactDuplicatesCount++;
                $isPrior = isset($seenInBatch[$signatureKey]) && ! $exactMatch;
                if (count($exactDuplicatesSample) < 5) {
                    $exactDuplicatesSample[] = [
                        'row_number' => $rowNum,
                        'tdate' => $parsedDate,
                        'checkno' => $checkno,
                        'debit' => $debit,
                        'credit' => $credit,
                        'running_balance' => $runningBalance,
                        'matched_existing_id' => $exactMatch?->id,
                        'matched_prior_row' => $isPrior ? ($seenInBatch[$signatureKey]['row_number'] ?? null) : null,
                    ];
                }
                $seenInBatch[$signatureKey] = $importedRecord;
                continue;
            }

            // Possible duplicate check
            if ($existingMatches->isNotEmpty()) {
                $possibleDuplicatesCount++;
                $bestExisting = $existingMatches->first();

                $differences = [];
                if ($bestExisting) {
                    if ($debit !== null && abs((float) ($bestExisting->debit ?? 0) - $debit) >= 0.01) {
                        $differences[] = [
                            'field' => 'debit',
                            'label' => 'Debit Amount',
                            'existing' => $bestExisting->debit ? number_format((float) $bestExisting->debit, 2) : '0.00',
                            'imported' => number_format($debit, 2),
                        ];
                    }
                    if (Carbon::parse($bestExisting->tdate)->format('Y-m-d') !== $parsedDate) {
                        $differences[] = [
                            'field' => 'tdate',
                            'label' => 'Transaction Date',
                            'existing' => Carbon::parse($bestExisting->tdate)->format('Y-m-d'),
                            'imported' => $parsedDate,
                        ];
                    }
                    if (abs((float) $bestExisting->running_balance - $runningBalance) >= 0.001) {
                        $differences[] = [
                            'field' => 'running_balance',
                            'label' => 'Running Balance',
                            'existing' => number_format((float) $bestExisting->running_balance, 2),
                            'imported' => number_format($runningBalance, 2),
                        ];
                    }
                }

                $possibleDuplicates[] = [
                    'row_id' => $rowId,
                    'row_number' => $rowNum,
                    'identifier' => $checkno ? ('Check: '.$checkno) : ('Date: '.$parsedDate),
                    'existing_id' => $bestExisting?->id,
                    'existing_record' => $bestExisting ? [
                        'id' => $bestExisting->id,
                        'tdate' => Carbon::parse($bestExisting->tdate)->format('Y-m-d'),
                        'checkno' => $bestExisting->checkno,
                        'debit' => $bestExisting->debit ? (float) $bestExisting->debit : null,
                        'credit' => $bestExisting->credit ? (float) $bestExisting->credit : null,
                        'running_balance' => (float) $bestExisting->running_balance,
                        'branch_description' => $bestExisting->branch_description,
                        'partic' => $bestExisting->partic,
                    ] : null,
                    'imported_record' => $importedRecord,
                    'differences' => $differences,
                    'default_action' => 'update',
                ];

                $seenInBatch[$signatureKey] = $importedRecord;
                continue;
            }

            // Brand New row
            $newRowsCount++;
            if (count($newRowsSample) < 5) {
                $newRowsSample[] = [
                    'row_number' => $rowNum,
                    'tdate' => $parsedDate,
                    'checkno' => $checkno,
                    'debit' => $debit,
                    'credit' => $credit,
                    'running_balance' => $runningBalance,
                ];
            }
            $seenInBatch[$signatureKey] = $importedRecord;
        }

        return [
            'heading_row' => $headingRow,
            'headers_read' => $headerKeys,
            'total_rows' => $totalRows + $invalidRowsCount,
            'new_rows_count' => $newRowsCount,
            'exact_duplicates_count' => $exactDuplicatesCount,
            'possible_duplicates_count' => $possibleDuplicatesCount,
            'invalid_rows_count' => $invalidRowsCount,
            'possible_duplicates' => $possibleDuplicates,
            'new_rows_sample' => $newRowsSample,
            'exact_duplicates_sample' => $exactDuplicatesSample,
            'invalid_rows' => $invalidRows,
            'batch_context' => $batchContext,
        ];
    }

    /**
     * Read spreadsheet rows and headers starting from specified heading row (1-indexed).
     *
     * @return array{headers: string[], data: array<int, array<string, mixed>>}
     */
    private function extractRowsWithHeaders(string $filePath, int $headingRow): array
    {
        $spreadsheet = IOFactory::load($filePath);
        $sheet = $spreadsheet->getSheet(0);
        $highestRow = $sheet->getHighestRow();
        $highestColumn = $sheet->getHighestColumn();

        // 1. Read header row
        $headerValues = $sheet->rangeToArray("A{$headingRow}:{$highestColumn}{$headingRow}", null, true, false)[0] ?? [];
        $headers = [];

        foreach ($headerValues as $colIndex => $value) {
            $stringValue = is_string($value) ? trim($value) : (string) $value;
            if ($stringValue === '') {
                $headers[$colIndex] = 'column_'.$colIndex;
                continue;
            }
            $headers[$colIndex] = Str::of($stringValue)->slug('_')->lower()->toString();
        }

        // 2. Read data rows
        $data = [];
        $startDataRow = $headingRow + 1;

        if ($startDataRow <= $highestRow) {
            $rawRows = $sheet->rangeToArray("A{$startDataRow}:{$highestColumn}{$highestRow}", null, true, false);

            foreach ($rawRows as $row) {
                $mappedRow = [];
                foreach ($headers as $colIndex => $headerName) {
                    $mappedRow[$headerName] = $row[$colIndex] ?? null;
                }
                $data[] = $mappedRow;
            }

            // Trim trailing completely empty rows after the last row with actual data
            $lastDataIndex = -1;
            foreach ($data as $i => $r) {
                foreach ($r as $val) {
                    if ($val !== null && trim((string) $val) !== '') {
                        $lastDataIndex = $i;
                        break;
                    }
                }
            }
            if ($lastDataIndex >= 0) {
                $data = array_slice($data, 0, $lastDataIndex + 1);
            }
        }

        return [
            'headers' => array_values(array_filter($headers, fn ($h) => ! str_starts_with($h, 'column_'))),
            'data' => $data,
        ];
    }

    /**
     * Map row headers according to user-specified mapping.
     */
    private function applyMapping(array $row, array $mapping): array
    {
        if (empty($mapping)) {
            return $row;
        }

        $mapped = [];
        foreach ($mapping as $target => $source) {
            if (! is_string($source) || $source === '') {
                continue;
            }

            $mapped[$target] = $row[$source] ?? null;
        }

        return array_merge($row, $mapped);
    }
}
