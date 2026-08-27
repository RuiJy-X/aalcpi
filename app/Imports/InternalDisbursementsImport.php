<?php

namespace App\Imports;

use App\Models\BankStatement;
use App\Models\ImportJob;
use App\Models\InternalDisbursements;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithChunkReading;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Events\AfterImport;
use Maatwebsite\Excel\Events\ImportFailed;
use PhpOffice\PhpSpreadsheet\Shared\Date;

class InternalDisbursementsImport implements ToModel, WithChunkReading, WithEvents, WithHeadingRow
{
    protected ?int $importJobId;

    protected ?string $filePath;

    protected string $dateIssued;

    protected int $disbursementWeek;

    protected array $mapping = [];

    protected array $duplicateResolutions = [];

    protected int $rowsRead = 0;

    protected int $rowsSaved = 0;

    protected int $rowsSkipped = 0;

    protected int $newRowsCount = 0;

    protected int $exactDuplicatesCount = 0;

    protected int $invalidRowsCount = 0;

    protected int $possibleDuplicatesUpdated = 0;

    protected int $possibleDuplicatesReplaced = 0;

    protected int $possibleDuplicatesKeptBoth = 0;

    protected array $warnings = [];

    protected array $headersRead = [];

    protected array $seenInBatch = [];

    public function __construct(
        ?int $importJobId = null,
        ?string $filePath = null,
        string $dateIssued = '',
        int $disbursementWeek = 1,
        array $mapping = [],
        array $duplicateResolutions = []
    ) {
        $this->importJobId = $importJobId;
        $this->filePath = $filePath;
        $this->dateIssued = $dateIssued;
        $this->disbursementWeek = $disbursementWeek;
        $this->mapping = $mapping;
        $this->duplicateResolutions = $duplicateResolutions;
    }

    public function headingRow(): int
    {
        return 6;
    }

    public function chunkSize(): int
    {
        return 1000;
    }

    public function model(array $row)
    {
        $hasAnyContent = false;
        foreach ($row as $val) {
            if ($val !== null && trim((string) $val) !== '') {
                $hasAnyContent = true;
                break;
            }
        }

        if (! $hasAnyContent) {
            return null;
        }

        $this->rowsRead++;
        if (empty($this->headersRead)) {
            $this->headersRead = array_keys($row);
        }

        $rowNum = $this->rowsRead + $this->headingRow();
        $rowMapped = $this->applyMapping($row);

        $rawCheckNo = $rowMapped['check_no'] ?? $rowMapped['check_no.'] ?? '';
        $rawAuditNo = $rowMapped['audit_no'] ?? null;
        $rawAmount = $rowMapped['check_amount'] ?? null;

        $checkNo = trim((string) $rawCheckNo);
        $auditNo = $rawAuditNo !== null && trim((string) $rawAuditNo) !== '' ? trim((string) $rawAuditNo) : null;

        if ($checkNo === '' && $auditNo === null) {
            $this->invalidRowsCount++;
            $this->rowsSkipped++;
            $this->warnings[] = "Row {$rowNum}: Skipped row (Check Number and Audit Number are both empty).";

            return null;
        }

        $checkAmountClean = str_replace([',', ' '], '', (string) $rawAmount);
        if ($rawAmount === null || $rawAmount === '' || ! is_numeric($checkAmountClean)) {
            $this->invalidRowsCount++;
            $this->rowsSkipped++;
            $this->warnings[] = "Row {$rowNum}: Skipped row (Invalid check amount '{$rawAmount}').";

            return null;
        }

        $checkAmount = round((float) $checkAmountClean, 2);
        $payeeName = trim((string) ($rowMapped['payee_name'] ?? 'Unknown Payee'));

        $dateReturn = null;
        if (! empty($rowMapped['date_return'])) {
            $dateReturn = is_numeric($rowMapped['date_return'])
                ? Date::excelToDateTimeObject($rowMapped['date_return'])->format('Y-m-d')
                : date('Y-m-d', strtotime($rowMapped['date_return']));
        }

        $rowId = 'row_'.$rowNum;
        $rowIdentifierKey = $checkNo !== '' ? $checkNo : ('audit:'.$auditNo);

        // 1. Query candidate records matching the check number or audit number
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

        // 2. Exact Duplicate Check
        $exactMatch = $existingMatches->first(function (InternalDisbursements $existing) use (
            $checkNo,
            $checkAmount,
            $payeeName,
            $auditNo
        ) {
            $checkMatch = trim((string) $existing->check_no) === $checkNo ||
                (ltrim($existing->check_no, '0') !== '' && ltrim($existing->check_no, '0') === ltrim($checkNo, '0'));
            $amountMatch = abs((float) $existing->check_amount - $checkAmount) < 0.01;
            $payeeMatch = strcasecmp(trim((string) $existing->payee_name), $payeeName) === 0;

            $dateMatch = true;
            if ($this->dateIssued && $existing->date_issued) {
                $dateMatch = Carbon::parse($existing->date_issued)->format('Y-m-d') === Carbon::parse($this->dateIssued)->format('Y-m-d');
            }

            $weekMatch = true;
            if ($this->disbursementWeek && $existing->disbursement_week !== null) {
                $weekMatch = (int) $existing->disbursement_week === (int) $this->disbursementWeek;
            }

            $auditMatch = true;
            if ($auditNo !== null && $existing->audit_no !== null) {
                $auditMatch = trim((string) $existing->audit_no) === $auditNo;
            }

            return $checkMatch && $amountMatch && $payeeMatch && $dateMatch && $weekMatch && $auditMatch;
        });

        $intraBatchExact = isset($this->seenInBatch[$rowIdentifierKey]) &&
            abs($this->seenInBatch[$rowIdentifierKey]['check_amount'] - $checkAmount) < 0.01 &&
            strcasecmp($this->seenInBatch[$rowIdentifierKey]['payee_name'], $payeeName) === 0;

        if ($exactMatch || $intraBatchExact) {
            // AUTOMATICALLY SKIP EXACT DUPLICATE
            $this->exactDuplicatesCount++;
            $this->rowsSkipped++;
            $this->seenInBatch[$rowIdentifierKey] = [
                'check_amount' => $checkAmount,
                'payee_name' => $payeeName,
            ];

            return null;
        }

        // 3. Possible Duplicate Check
        if ($existingMatches->isNotEmpty()) {
            $bestExisting = $existingMatches->first();
            $resolution = $this->duplicateResolutions[$rowId]
                ?? $this->duplicateResolutions[$checkNo]
                ?? 'update';

            if ($resolution === 'update') {
                $bestExisting->update([
                    'payee_name' => $payeeName,
                    'check_amount' => $checkAmount,
                    'date_return' => $dateReturn,
                    'audit_no' => $auditNo,
                    'date_issued' => $this->dateIssued ?: $bestExisting->date_issued,
                    'disbursement_week' => $this->disbursementWeek ?: $bestExisting->disbursement_week,
                    'import_job_id' => $this->importJobId,
                ]);

                $this->possibleDuplicatesUpdated++;
                $this->rowsSaved++;
                $this->seenInBatch[$rowIdentifierKey] = [
                    'check_amount' => $checkAmount,
                    'payee_name' => $payeeName,
                ];

                return null;
            }

            if ($resolution === 'replace') {
                $bestExisting->update([
                    'payee_name' => $payeeName,
                    'check_amount' => $checkAmount,
                    'date_return' => $dateReturn,
                    'audit_no' => $auditNo,
                    'date_issued' => $this->dateIssued ?: $bestExisting->date_issued,
                    'disbursement_week' => $this->disbursementWeek ?: $bestExisting->disbursement_week,
                    'bank_statement_id' => null,
                    'status' => 'Outstanding',
                    'import_job_id' => $this->importJobId,
                ]);

                $this->possibleDuplicatesReplaced++;
                $this->rowsSaved++;
                $this->seenInBatch[$rowIdentifierKey] = [
                    'check_amount' => $checkAmount,
                    'payee_name' => $payeeName,
                ];

                return null;
            }

            // Resolution: 'keep_both' -> proceed to create new row
            $this->possibleDuplicatesKeptBoth++;
        } else {
            $this->newRowsCount++;
        }

        $matchedBankRecord = InternalDisbursements::findBankMatchFor(
            $checkNo,
            $checkAmount,
            $this->dateIssued,
            true,
        );

        $this->rowsSaved++;
        $this->seenInBatch[$rowIdentifierKey] = [
            'check_amount' => $checkAmount,
            'payee_name' => $payeeName,
        ];

        return InternalDisbursements::create([
            'audit_no' => $auditNo,
            'check_no' => $checkNo,
            'payee_name' => $payeeName,
            'check_amount' => $checkAmount,
            'date_return' => $dateReturn,
            'disbursement_week' => $this->disbursementWeek,
            'bank_statement_id' => $matchedBankRecord?->id,
            'date_issued' => $this->dateIssued,
            'import_job_id' => $this->importJobId,
        ]);
    }

    public function registerEvents(): array
    {
        return [
            AfterImport::class => function (): void {
                Cache::forget('bank_recon_week_options');

                if ($this->importJobId !== null) {
                    InternalDisbursements::reconcileUnmatched();
                    BankStatement::refreshDuplicateFlags();
                    InternalDisbursements::refreshDuplicateFlags();

                    $duplicateCount = InternalDisbursements::where('is_duplicate', true)->count();
                    $importJob = ImportJob::find($this->importJobId);

                    if ($importJob) {
                        $possibleDuplicatesTotal = $this->possibleDuplicatesUpdated + $this->possibleDuplicatesReplaced + $this->possibleDuplicatesKeptBoth;

                        $context = array_merge($importJob->context ?? [], [
                            'heading_row' => $this->headingRow(),
                            'headers_read' => $this->headersRead,
                            'rows_read' => $this->rowsRead,
                            'rows_saved' => $this->rowsSaved,
                            'rows_skipped' => $this->rowsSkipped,
                            'new_rows_count' => $this->newRowsCount,
                            'exact_duplicates_count' => $this->exactDuplicatesCount,
                            'invalid_rows_count' => $this->invalidRowsCount,
                            'possible_duplicates_count' => $possibleDuplicatesTotal,
                            'updated_count' => $this->possibleDuplicatesUpdated,
                            'replaced_count' => $this->possibleDuplicatesReplaced,
                            'kept_both_count' => $this->possibleDuplicatesKeptBoth,
                            'warnings' => $this->warnings,
                            'duplicate_count' => $duplicateCount,
                        ]);

                        $message = "Import complete. {$this->rowsSaved} rows imported/updated. Skipped {$this->rowsSkipped} rows total ({$this->exactDuplicatesCount} exact duplicates skipped, {$this->invalidRowsCount} invalid rows skipped).";
                        if ($duplicateCount > 0) {
                            $message .= " {$duplicateCount} row(s) share a check number.";
                        }

                        $importJob->update([
                            'status' => ImportJob::STATUS_DONE,
                            'finished_at' => now(),
                            'context' => $context,
                            'message' => $message,
                        ]);
                    }
                }

                if ($this->filePath && Storage::disk('local')->exists($this->filePath)) {
                    Storage::disk('local')->delete($this->filePath);
                }
            },
            ImportFailed::class => function (ImportFailed $event): void {
                if ($this->importJobId !== null) {
                    $importJob = ImportJob::find($this->importJobId);
                    if ($importJob) {
                        $context = array_merge($importJob->context ?? [], [
                            'heading_row' => $this->headingRow(),
                            'rows_read' => $this->rowsRead,
                            'rows_saved' => $this->rowsSaved,
                            'rows_skipped' => $this->rowsSkipped,
                            'exact_duplicates_count' => $this->exactDuplicatesCount,
                            'warnings' => $this->warnings,
                            'error' => $event->getException()->getMessage(),
                        ]);

                        $importJob->update([
                            'status' => ImportJob::STATUS_FAILED,
                            'finished_at' => now(),
                            'context' => $context,
                            'message' => $event->getException()->getMessage(),
                        ]);
                    }
                }

                if ($this->filePath && Storage::disk('local')->exists($this->filePath)) {
                    Storage::disk('local')->delete($this->filePath);
                }
            },
        ];
    }

    private function applyMapping(array $row): array
    {
        if (empty($this->mapping)) {
            return $row;
        }

        $mapped = [];
        foreach ($this->mapping as $target => $source) {
            if (! is_string($source) || $source === '') {
                continue;
            }

            $mapped[$target] = $row[$source] ?? null;
        }

        return array_merge($row, $mapped);
    }
}
