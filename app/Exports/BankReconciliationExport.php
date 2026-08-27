<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class BankReconciliationExport implements FromArray, WithColumnWidths, WithStyles, WithTitle
{
    public function __construct(
        protected string $reportTitle,
        protected string $dateRangeLabel,
        protected array $months,
        protected float $grandTotal,
        protected int $totalCount
    ) {}

    public function title(): string
    {
        // Sheet title max length is 31 chars in Excel
        return substr($this->reportTitle, 0, 31);
    }

    public function columnWidths(): array
    {
        return [
            'A' => 8,   // No.
            'B' => 14,  // Date
            'C' => 38,  // Payee's Name
            'D' => 22,  // Check Number
            'E' => 20,  // Amount
            'F' => 18,  // Date Cleared
            'G' => 22,  // Status
        ];
    }

    public function array(): array
    {
        $rows = [];

        // 1. Report Header Block
        $rows[] = ['LA CARLOTA MILL DISTRICT MULTI-PURPOSE COOPERATIVE, INC'];
        $rows[] = [strtoupper($this->reportTitle)];
        $rows[] = [$this->dateRangeLabel];
        $rows[] = []; // Empty separator

        // 2. Data Table Blocks by Month
        if (empty($this->months)) {
            $rows[] = ['No records found for the specified criteria.'];
        } else {
            foreach ($this->months as $month) {
                // Month Header Banner
                $rows[] = [strtoupper($month['month_label'])];

                // Table Columns Header
                $rows[] = [
                    'No.',
                    'Date',
                    "Payee's Name",
                    'Check Number',
                    'Amount',
                    'Date Cleared',
                    'Status',
                ];

                // Data Rows
                foreach ($month['items'] as $item) {
                    $rows[] = [
                        $item['no'],
                        '', // Date left blank as requested
                        $item['payee_name'] ?? '',
                        $item['check_no'] ?? '',
                        (float) ($item['amount'] ?? 0),
                        $item['date_cleared'] ?? '',
                        $item['status'] ?? '',
                    ];
                }

                // Month Subtotal Row
                $rows[] = [
                    '',
                    '',
                    '',
                    "Subtotal for {$month['month_label']}:",
                    (float) ($month['subtotal'] ?? 0),
                    '',
                    '',
                ];

                // Spacing between months
                $rows[] = [];
            }

            // 3. Grand Total Block
            $checkSuffix = $this->totalCount === 1 ? 'check' : 'checks';
            $rows[] = [
                '',
                '',
                '',
                "GRAND TOTAL {$this->reportTitle} ({$this->totalCount} {$checkSuffix}):",
                (float) $this->grandTotal,
                '',
                '',
            ];
        }

        return $rows;
    }

    public function styles(Worksheet $sheet)
    {
        // Default Plain Arial Font
        $sheet->getParent()->getDefaultStyle()->applyFromArray([
            'font' => [
                'name' => 'Arial',
                'size' => 10,
                'bold' => false,
            ],
        ]);

        // Column Alignments
        $sheet->getStyle('A:A')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle('B:B')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle('C:C')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);
        $sheet->getStyle('D:D')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle('E:E')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);
        $sheet->getStyle('F:F')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle('G:G')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        // Amount Number Format
        $sheet->getStyle('E:E')->getNumberFormat()->setFormatCode('#,##0.00');

        return [];
    }
}


