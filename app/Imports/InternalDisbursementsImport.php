<?php

namespace App\Imports;

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

    public function __construct(
        int $importJobId,
        string $filePath,
        string $dateIssued,
        int $disbursementWeek,
    ) {
        $this->importJobId = $importJobId;
        $this->filePath = $filePath;
        $this->dateIssued = $dateIssued;
        $this->disbursementWeek = $disbursementWeek;
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
        if (empty($row['check_no']) && empty($row['audit_no'])) {
            return null;
        }

        $checkNo = trim((string) ($row['check_no'] ?? $row['check_no.'] ?? ''));
        $auditNo = !empty($row['audit_no']) ? trim((string) $row['audit_no']) : null;
        $checkAmount = is_numeric($row['check_amount']) ? (float) $row['check_amount'] : 0.00;

        $dateReturn = null;
        if (!empty($row['date_return'])) {
            $dateReturn = is_numeric($row['date_return'])
                ? Date::excelToDateTimeObject($row['date_return'])->format('Y-m-d')
                : date('Y-m-d', strtotime($row['date_return']));
        }

        $matchedBankRecord = InternalDisbursements::findBankMatchFor(
            $checkNo,
            $checkAmount,
            $this->dateIssued,
        );

        // Always insert — duplicates (same check_no appearing more than
        // once) are intentionally kept, not merged. refreshDuplicateFlags()
        // in AfterImport below marks them so they're visible in the UI,
        // and the caller (ProcessBankReconImportJob) already deleted any
        // prior rows for this exact date_issued + disbursement_week batch
        // before this import ran, so re-uploading the same file replaces
        // the old batch instead of stacking on top of it.
        return InternalDisbursements::create([
            'audit_no' => $auditNo,
            'check_no' => $checkNo,
            'payee_name' => $row['payee_name'] ?? 'Unknown Payee',
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
                    InternalDisbursements::refreshDuplicateFlags();

                    $duplicateCount = InternalDisbursements::where('is_duplicate', true)->count();

                    ImportJob::find($this->importJobId)?->markDone(
                        $duplicateCount > 0
                            ? "Import complete. {$duplicateCount} row(s) currently share a check number with another record."
                            : 'Import complete.'
                    );
                }
                if ($this->filePath) {
                    Storage::disk('local')->delete($this->filePath);
                }
            },
            ImportFailed::class => function (ImportFailed $event): void {
                if ($this->importJobId !== null) {
                    ImportJob::find($this->importJobId)?->markFailed(
                        $event->getException()->getMessage()
                    );
                }
                if ($this->filePath) {
                    Storage::disk('local')->delete($this->filePath);
                }
            },
        ];
    }
}