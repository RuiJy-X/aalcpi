<?php

namespace App\Imports;

use App\Models\InternalDisbursements;
use App\Models\BankStatement;
use App\Models\ImportJob;
use Illuminate\Support\Facades\Storage;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithEvents; // <-- 1. ADD THIS IMPORT
use Maatwebsite\Excel\Events\AfterImport;
use Maatwebsite\Excel\Events\ImportFailed;
use PhpOffice\PhpSpreadsheet\Shared\Date;

// 2. ADD "WithEvents" TO THE IMPLEMENTS CONTRACT BELOW
class InternalDisbursementsImport implements ToModel, WithHeadingRow, WithEvents
{
    protected $importJobId;
    protected $filePath; // Using $filePath consistently

    public function __construct(int $importJobId, string $filePath)
    {
        $this->importJobId = $importJobId;
        $this->filePath = $filePath;
    }

    public function headingRow(): int
    {
        return 6;
    }

    public function model(array $row)
    {
        if (empty($row['check_no']) && empty($row['audit_no'])) {
            return null;
        }

        $checkNo = trim((string)($row['check_no'] ?? $row['check_no.'] ?? ''));
        $checkAmount = is_numeric($row['check_amount']) ? (float)$row['check_amount'] : 0.00;

        $dateReturn = null;
        if (!empty($row['date_return'])) {
            $dateReturn = is_numeric($row['date_return'])
                ? Date::excelToDateTimeObject($row['date_return'])->format('Y-m-d')
                : date('Y-m-d', strtotime($row['date_return']));
        }

        $matchedBankRecord = BankStatement::where('checkno', $checkNo)
            ->whereDoesntHave('internalDisbursement')
            ->first();

        return InternalDisbursements::updateOrCreate(
            [
                'audit_no' => !empty($row['audit_no']) ? trim((string)$row['audit_no']) : null,
                'check_no' => $checkNo,
            ],
            [
                'payee_name' => $row['payee_name'] ?? 'Unknown Payee',
                'check_amount' => $checkAmount,
                'date_return' => $dateReturn,
                'bank_statement_id' => $matchedBankRecord?->id ?? null, 
            ]
        );
    }

    // 3. REMOVE chunkSize() if you aren't using WithChunkReading anymore.
    // Since ProcessBankReconImportJob handles background execution, 
    // it processes the sheets in one clean cycle inside the worker process.

    public function registerEvents(): array
    {
        return [
            AfterImport::class => function (): void {
                if ($this->importJobId !== null) {
                    // Update job tracking state status
                    $job = ImportJob::find($this->importJobId);
                    if ($job) {
                        $job->update(['status' => 'done']); // or use your $job->markDone() method if defined
                    }
                    InternalDisbursements::reconcileUnmatched();
                }
                if ($this->filePath) {
                    Storage::disk('local')->delete($this->filePath);
                }
            },
            ImportFailed::class => function (ImportFailed $event): void {
                if ($this->importJobId !== null) {
                    $job = ImportJob::find($this->importJobId);
                    if ($job) {
                        $job->update([
                            'status' => 'failed',
                            'error_log' => $event->getException()->getMessage()
                        ]);
                    }
                }
                if ($this->filePath) {
                    Storage::disk('local')->delete($this->filePath);
                }
            },
        ];
    }
}