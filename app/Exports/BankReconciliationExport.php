<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\WithMultipleSheets;

class BankReconciliationExport implements WithMultipleSheets
{
    public function __construct(
        protected array $sheetsData,
        protected array $fileAuditStats,
        protected array $meta
    ) {}

    public function sheets(): array
    {
        $sheetDefinitions = [
            'All' => 'All Reconciliation Records',
            'Outstanding' => 'Outstanding Checks',
            'Unrecorded' => 'Unrecorded Bank Entries',
            'Matched' => 'Matched Entries',
            'Mismatch' => 'Amount Mismatches',
            'Duplicates' => 'Duplicate Records',
        ];

        $sheets = [];
        foreach ($sheetDefinitions as $sheetKey => $sheetLabel) {
            $records = $this->sheetsData[$sheetKey] ?? collect();

            $sheets[] = new BankReconStatusSheetExport(
                $sheetKey,
                $sheetLabel,
                $records,
                $this->fileAuditStats,
                $this->meta
            );
        }

        return $sheets;
    }
}
