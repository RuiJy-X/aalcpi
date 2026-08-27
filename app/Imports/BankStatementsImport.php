<?php

namespace App\Imports;

use App\Models\BankStatement;
use App\Models\ImportJob;
use App\Models\InternalDisbursements;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithChunkReading;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Events\AfterImport;
use Maatwebsite\Excel\Events\ImportFailed;
use PhpOffice\PhpSpreadsheet\Shared\Date;

class BankStatementsImport implements ToModel, WithChunkReading, WithEvents, WithHeadingRow
{
    protected int $rowsRead = 0;

    protected int $rowsSaved = 0;

    protected int $rowsSkipped = 0;

    protected int $invalidRowsCount = 0;

    protected int $newRowsCount = 0;

    protected int $exactDuplicatesCount = 0;

    protected int $possibleDuplicatesUpdated = 0;

    protected int $possibleDuplicatesReplaced = 0;

    protected int $possibleDuplicatesKeptBoth = 0;

    protected array $warnings = [];

    protected array $headersRead = [];

    protected array $seenInBatch = [];

    public function __construct(
        private readonly ?int $importJobId = null,
        private readonly ?string $storedPath = null,
        private readonly ?string $bankDate = null,
        private readonly array $mapping = [],
        private readonly array $duplicateResolutions = []
    ) {}

    public function headingRow(): int
    {
        return 1;
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

        $rawDate = trim((string) ($rowMapped['tdate'] ?? ''));
        $rawBalance = $rowMapped['running_balance'] ?? null;
        $hasBalance = $rawBalance !== null && $rawBalance !== '';

        if ($rawDate === '' && ! $hasBalance) {
            $this->invalidRowsCount++;
            $this->rowsSkipped++;
            $this->warnings[] = "Row {$rowNum}: Skipped empty row.";

            return null;
        }

        if ($rawDate === '') {
            $this->invalidRowsCount++;
            $this->rowsSkipped++;
            $this->warnings[] = "Row {$rowNum}: Skipped row (missing transaction date).";
            Log::warning('Bank statement row skipped: missing tdate', [
                'import_job_id' => $this->importJobId,
                'row' => $rowMapped,
            ]);

            return null;
        }

        $toNum = function ($val) {
            if ($val === null || $val === '') {
                return null;
            }
            $cleanVal = str_replace([',', ' '], '', trim((string) $val));

            return is_numeric($cleanVal) ? (float) $cleanVal : null;
        };

        if (is_numeric($rawDate)) {
            $parsedDate = Date::excelToDateTimeObject($rawDate)->format('Y-m-d');
        } else {
            $dateObj = \DateTime::createFromFormat('m/d/Y', $rawDate);

            if ($dateObj) {
                $parsedDate = $dateObj->format('Y-m-d');
            } else {
                $fallback = strtotime($rawDate);
                if ($fallback === false) {
                    $this->invalidRowsCount++;
                    $this->rowsSkipped++;
                    $this->warnings[] = "Row {$rowNum}: Skipped row (unparseable date format '{$rawDate}').";
                    Log::warning('Bank statement row skipped: unparseable tdate', [
                        'import_job_id' => $this->importJobId,
                        'tdate' => $rawDate,
                    ]);

                    return null;
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

        $rowId = 'row_'.$rowNum;
        $signatureKey = $checkno
            ? ('chk:'.$checkno)
            : sprintf('txn:%s:%s:%s:%.2f', $parsedDate, (string) $debit, (string) $credit, $runningBalance);

        // 1. Query database candidates
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

        // 2. Exact Duplicate Check
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

        if ($exactMatch || isset($this->seenInBatch[$signatureKey])) {
            // AUTOMATICALLY SKIP EXACT DUPLICATE
            $this->exactDuplicatesCount++;
            $this->rowsSkipped++;
            $this->seenInBatch[$signatureKey] = true;

            return null;
        }

        // 3. Possible Duplicate Check
        if ($existingMatches->isNotEmpty()) {
            $bestExisting = $existingMatches->first();
            $resolution = $this->duplicateResolutions[$rowId]
                ?? ($checkno ? ($this->duplicateResolutions[$checkno] ?? 'update') : 'update');

            if ($resolution === 'update') {
                $bestExisting->update([
                    'tdate' => $parsedDate,
                    'checkno' => $checkno,
                    'running_balance' => $runningBalance,
                    'branch_description' => $branchDesc,
                    'partic' => $partic,
                    'debit' => $debit,
                    'credit' => $credit,
                    'currency' => $currency,
                    'import_job_id' => $this->importJobId,
                    'bank_date' => $this->bankDate ?: $bestExisting->bank_date,
                ]);

                $this->possibleDuplicatesUpdated++;
                $this->rowsSaved++;
                $this->seenInBatch[$signatureKey] = true;

                return null;
            }

            if ($resolution === 'replace') {
                // Detach any internal disbursements pointing to this row
                InternalDisbursements::where('bank_statement_id', $bestExisting->id)
                    ->update(['bank_statement_id' => null]);

                $bestExisting->update([
                    'tdate' => $parsedDate,
                    'checkno' => $checkno,
                    'running_balance' => $runningBalance,
                    'branch_description' => $branchDesc,
                    'partic' => $partic,
                    'debit' => $debit,
                    'credit' => $credit,
                    'currency' => $currency,
                    'import_job_id' => $this->importJobId,
                    'bank_date' => $this->bankDate ?: $bestExisting->bank_date,
                ]);

                $this->possibleDuplicatesReplaced++;
                $this->rowsSaved++;
                $this->seenInBatch[$signatureKey] = true;

                return null;
            }

            // 'keep_both'
            $this->possibleDuplicatesKeptBoth++;
        } else {
            $this->newRowsCount++;
        }

        $this->rowsSaved++;
        $this->seenInBatch[$signatureKey] = true;

        return BankStatement::create([
            'tdate' => $parsedDate,
            'checkno' => $checkno,
            'running_balance' => $runningBalance,
            'branch_description' => $branchDesc,
            'partic' => $partic,
            'debit' => $debit,
            'credit' => $credit,
            'currency' => $currency,
            'import_job_id' => $this->importJobId,
            'bank_date' => $this->bankDate,
        ]);
    }

    public function registerEvents(): array
    {
        return [
            AfterImport::class => function (): void {
                if ($this->importJobId !== null) {
                    InternalDisbursements::reconcileUnmatched();
                    BankStatement::refreshDuplicateFlags();
                    InternalDisbursements::refreshDuplicateFlags();

                    $duplicateCount = BankStatement::where('is_duplicate', true)->count();
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

                        $message = "Import complete. {$this->rowsSaved} bank rows imported/updated. Skipped {$this->rowsSkipped} rows total ({$this->exactDuplicatesCount} exact duplicates skipped, {$this->invalidRowsCount} invalid rows skipped).";
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
                if ($this->storedPath && Storage::disk('local')->exists($this->storedPath)) {
                    Storage::disk('local')->delete($this->storedPath);
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
                if ($this->storedPath && Storage::disk('local')->exists($this->storedPath)) {
                    Storage::disk('local')->delete($this->storedPath);
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
