<?php

namespace App\Imports;

use App\Models\BankStatement;
use App\Models\ImportJob;
use App\Models\InternalDisbursements;
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

    protected array $warnings = [];

    protected array $headersRead = [];

    public function __construct(
        private readonly ?int $importJobId = null,
        private readonly ?string $storedPath = null,
        private readonly ?string $bankDate = null,
        private readonly array $mapping = []
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
            $this->rowsSkipped++;
            $this->warnings[] = "Row {$rowNum}: Skipped empty row.";

            return null;
        }

        if ($rawDate === '') {
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
            $cleanVal = str_replace(',', '', trim((string) $val));

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

        $this->rowsSaved++;

        return BankStatement::create([
            'tdate' => $parsedDate,
            'checkno' => ! empty($rowMapped['checkno']) ? trim((string) $rowMapped['checkno']) : null,
            'running_balance' => $toNum($rawBalance),
            'branch_description' => $rowMapped['branch_description'] ?? null,
            'partic' => $rowMapped['partic'] ?? null,
            'debit' => $toNum($rowMapped['debit'] ?? null),
            'credit' => $toNum($rowMapped['credit'] ?? null),
            'currency' => $rowMapped['currency'] ?? 'PHP',
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
                        $context = array_merge($importJob->context ?? [], [
                            'heading_row' => $this->headingRow(),
                            'headers_read' => $this->headersRead,
                            'rows_read' => $this->rowsRead,
                            'rows_saved' => $this->rowsSaved,
                            'rows_skipped' => $this->rowsSkipped,
                            'warnings' => $this->warnings,
                            'duplicate_count' => $duplicateCount,
                        ]);

                        $importJob->update([
                            'status' => ImportJob::STATUS_DONE,
                            'finished_at' => now(),
                            'context' => $context,
                            'message' => $duplicateCount > 0
                                ? "Import complete. {$this->rowsSaved} bank rows imported, {$this->rowsSkipped} skipped. {$duplicateCount} row(s) share a check number."
                                : "Import complete. {$this->rowsSaved} bank rows imported, {$this->rowsSkipped} skipped.",
                        ]);
                    }
                }
                if ($this->storedPath) {
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
                if ($this->storedPath) {
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
