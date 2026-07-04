<?php

namespace App\Imports;

use App\Models\BankStatement;
use App\Models\ImportJob;
use App\Models\InternalDisbursements;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithChunkReading;
use Maatwebsite\Excel\Events\AfterImport;
use Maatwebsite\Excel\Events\ImportFailed;
use PhpOffice\PhpSpreadsheet\Shared\Date;

class BankStatementsImport implements ToModel, WithHeadingRow, WithEvents, WithChunkReading
{
    public function __construct(
        private readonly ?int $importJobId = null,
        private readonly ?string $storedPath = null,
        private readonly ?string $bankDate = null
    ) {}

    public function chunkSize(): int
    {
        return 1000;
    }

    public function model(array $row)
    {
        $rawDate = trim((string) ($row['tdate'] ?? ''));
        $rawBalance = $row['running_balance'] ?? null;
        $hasBalance = $rawBalance !== null && $rawBalance !== '';

        if ($rawDate === '' && !$hasBalance) {
            return null; // fully empty row
        }

        // A row with a balance but no date is malformed. Falling through
        // to strtotime('') => false => date('Y-m-d', false) silently
        // produces 1970-01-01 — skip and log instead.
        if ($rawDate === '') {
            Log::warning('Bank statement row skipped: missing tdate', [
                'import_job_id' => $this->importJobId,
                'row' => $row,
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
                    Log::warning('Bank statement row skipped: unparseable tdate', [
                        'import_job_id' => $this->importJobId,
                        'tdate' => $rawDate,
                    ]);
                    return null;
                }
                $parsedDate = date('Y-m-d', $fallback);
            }
        }

        // Always insert — see note in InternalDisbursementsImport::model().
        return BankStatement::create([
            'tdate' => $parsedDate,
            'checkno' => !empty($row['checkno']) ? trim((string) $row['checkno']) : null,
            'running_balance' => $toNum($rawBalance),
            'branch_description' => $row['branch_description'] ?? null,
            'partic' => $row['partic'] ?? null,
            'debit' => $toNum($row['debit'] ?? null),
            'credit' => $toNum($row['credit'] ?? null),
            'currency' => $row['currency'] ?? 'PHP',
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

                    ImportJob::find($this->importJobId)?->markDone(
                        $duplicateCount > 0
                            ? "Import complete. {$duplicateCount} bank row(s) currently share a check number with another record."
                            : 'Import complete.'
                    );
                }
                if ($this->storedPath) {
                    Storage::disk('local')->delete($this->storedPath);
                }
            },
            ImportFailed::class => function (ImportFailed $event): void {
                if ($this->importJobId !== null) {
                    ImportJob::find($this->importJobId)?->markFailed(
                        $event->getException()->getMessage()
                    );
                }
                if ($this->storedPath) {
                    Storage::disk('local')->delete($this->storedPath);
                }
            },
        ];
    }
}