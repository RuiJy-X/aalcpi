<?php

namespace App\Imports;

use App\Models\BankStatement;
use App\Models\InternalDisbursements;
use App\Models\ImportJob;
use Illuminate\Support\Facades\Storage;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithChunkReading;
use Maatwebsite\Excel\Events\AfterImport;
use Maatwebsite\Excel\Events\ImportFailed;
use PhpOffice\PhpSpreadsheet\Shared\Date;

class InternalDisbursementsImport implements ToModel, WithHeadingRow, WithEvents, WithChunkReading
{
    protected $importJobId;
    protected $filePath;
    protected string $dateIssued;
    protected int $disbursementWeek;
    protected int $rowsRead = 0;
    protected int $rowsSaved = 0;
    protected int $rowsSkipped = 0;
    protected array $warnings = [];
    protected array $headersRead = [];

    public function __construct(
        int $importJobId,
        string $filePath,
        string $dateIssued,
        int $disbursementWeek,
        array $mapping = [],
    ) {
        $this->importJobId = $importJobId;
        $this->filePath = $filePath;
        $this->dateIssued = $dateIssued;
        $this->disbursementWeek = $disbursementWeek;
        $this->mapping = $mapping;
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
        $this->rowsRead++;
        if (empty($this->headersRead)) {
            $this->headersRead = array_keys($row);
        }

        $rowNum = $this->rowsRead + $this->headingRow();
        $rowMapped = $this->applyMapping($row);

        if (empty($rowMapped['check_no']) && empty($rowMapped['audit_no'])) {
            $this->rowsSkipped++;
            $this->warnings[] = "Row {$rowNum}: Skipped row (Check Number and Audit Number are both empty).";
            return null;
        }

        $checkNo = trim((string) ($rowMapped['check_no'] ?? $rowMapped['check_no.'] ?? ''));
        $auditNo = !empty($rowMapped['audit_no']) ? trim((string) $rowMapped['audit_no']) : null;
        $checkAmount = is_numeric($rowMapped['check_amount']) ? (float) $rowMapped['check_amount'] : 0.00;

        $dateReturn = null;
        if (!empty($rowMapped['date_return'])) {
            $dateReturn = is_numeric($rowMapped['date_return'])
                ? Date::excelToDateTimeObject($rowMapped['date_return'])->format('Y-m-d')
                : date('Y-m-d', strtotime($rowMapped['date_return']));
        }

        $matchedBankRecord = InternalDisbursements::findBankMatchFor(
            $checkNo,
            $checkAmount,
            $this->dateIssued,
            true,
        );

        $this->rowsSaved++;

        return InternalDisbursements::create([
            'audit_no' => $auditNo,
            'check_no' => $checkNo,
            'payee_name' => $rowMapped['payee_name'] ?? 'Unknown Payee',
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
                if ($this->importJobId !== null) {
                    InternalDisbursements::reconcileUnmatched();
                    BankStatement::refreshDuplicateFlags();
                    InternalDisbursements::refreshDuplicateFlags();

                    $duplicateCount = InternalDisbursements::where('is_duplicate', true)->count();
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
                                ? "Import complete. {$this->rowsSaved} rows imported, {$this->rowsSkipped} rows skipped. {$duplicateCount} row(s) share a check number."
                                : "Import complete. {$this->rowsSaved} rows imported, {$this->rowsSkipped} rows skipped.",
                        ]);
                    }
                }
                if ($this->filePath) {
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
                if ($this->filePath) {
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
            if (!is_string($source) || $source === '') {
                continue;
            }

            $mapped[$target] = $row[$source] ?? null;
        }

        return array_merge($row, $mapped);
    }
}
