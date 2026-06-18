<?php

namespace App\Imports;

use App\Models\BankStatement;
use App\Models\ImportJob;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Storage;
use Maatwebsite\Excel\Concerns\ToModel;

use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Events\AfterImport;
use Maatwebsite\Excel\Events\ImportFailed;
use PhpOffice\PhpSpreadsheet\Shared\Date;

class BankStatementsImport implements ToModel, WithHeadingRow
{
    public function __construct(
        private readonly ?int $importJobId = null,
        private readonly ?string $storedPath = null,
    ) {}

    public function model(array $row)
    {
        // Skip empty rows
        if (empty($row['tdate']) && empty($row['running_balance'])) {
            return null;
        }

        // Helper conversions
        $toNum = function($val) {
            if ($val === null || $val === '') {
                return null;
            }
            // Remove commas from the string (e.g., "34,600.50" becomes "34600.50")
            $cleanVal = str_replace(',', '', trim((string)$val));
            
            return is_numeric($cleanVal) ? (float) $cleanVal : null;
        };
        
       
        // Replace the old parsedDate code block with this robust explicit parser:
        $rawDate = trim((string)$row['tdate']);
        $parsedDate = null;

        if (is_numeric($rawDate)) {
            // If Excel imported it as a numeric serial number timestamp
            $parsedDate = Date::excelToDateTimeObject($rawDate)->format('Y-m-d');
        } else {
            // Force PHP to read it exactly as Day/Month/Year
            // This safely turns "10/06/2025" into "2025-06-10" for MySQL
            $dateObj = \DateTime::createFromFormat('d/m/Y', $rawDate);
            
            // Fallback just in case some rows use dashes or alternate formats
            $parsedDate = $dateObj ? $dateObj->format('Y-m-d') : date('Y-m-d', strtotime($rawDate));
        }

        return BankStatement::updateOrCreate(
            [
                'tdate' => $parsedDate,
                'checkno' => !empty($row['checkno']) ? trim((string)$row['checkno']) : null,
                'running_balance' => (float)$row['running_balance'],
            ],
            [
                'branch_description' => $row['branch_description'] ?? null,
                'partic' => $row['partic'] ?? null,
                'debit' => $toNum($row['debit'] ?? null),
                'credit' => $toNum($row['credit'] ?? null),
                'currency' => $row['currency'] ?? 'PHP',
            ]
        );
    }

    public function chunkSize(): int
    {
        return 1000;
    }

    public function registerEvents(): array
    {
        return [
            AfterImport::class => function (): void {
                if ($this->importJobId !== null) {
                    ImportJob::find($this->importJobId)?->markDone();
                }
                if ($this->storedPath) {
                    Storage::disk('local')->delete($this->storedPath);
                }
            },
            ImportFailed::class => function (ImportFailed $event): void {
                if ($this->importJobId !== null) {
                    ImportJob::find($this->importJobId)?->markFailed($event->getException()->getMessage());
                }
                if ($this->storedPath) {
                    Storage::disk('local')->delete($this->storedPath);
                }
            },
        ];
    }
}