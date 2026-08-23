<?php

namespace App\Exports;

use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class BankReconStatusSheetExport implements FromArray, WithColumnWidths, WithStyles, WithTitle
{
    protected int $tableHeaderRow = 0;

    protected int $tableDataStartRow = 0;

    protected int $tableDataEndRow = 0;

    protected int $totalRow = 0;

    public function __construct(
        protected string $title,
        protected string $statusLabel,
        protected Collection $records,
        protected array $fileAuditStats,
        protected array $meta
    ) {}

    public function title(): string
    {
        return $this->title;
    }

    public function columnWidths(): array
    {
        return [
            'A' => 22,  // Status
            'B' => 16,  // Check No
            'C' => 16,  // Duplicate Check?
            'D' => 36,  // Payee / Description
            'E' => 26,  // Internal Source
            'F' => 18,  // Internal Date Issued
            'G' => 18,  // Disbursement Week
            'H' => 18,  // Internal Amount
            'I' => 26,  // Bank Source
            'J' => 18,  // Bank Date
            'K' => 18,  // Transaction Date
            'L' => 18,  // Bank Amount
            'M' => 18,  // Variance
            'N' => 16,  // Days Outstanding
        ];
    }

    public function array(): array
    {
        $rows = [];

        // 1. Report Title and Period Header
        $rows[] = ['AGRI-AGRA LOT CLEARING & PLANTING INC. - BANK RECONCILIATION'];
        $rows[] = ['Sheet View: '.$this->statusLabel];
        $rows[] = [
            'Period: '.($this->fileAuditStats['period_label'] ?? $this->fileAuditStats['month_label'] ?? 'All Dates').
            ' | Generated: '.($this->meta['generated_at'] ?? now()->format('M d, Y h:i A')),
        ];

        // 2. Data Table Headers
        $this->tableHeaderRow = count($rows) + 1;
        $rows[] = [
            'Status',
            'Check No',
            'Duplicate Check?',
            'Payee / Description',
            'Internal Source',
            'Internal Date Issued',
            'Disbursement Week',
            'Internal Amount',
            'Bank Source',
            'Bank Date',
            'Transaction Date',
            'Bank Amount',
            'Variance',
            'Days Outstanding',
        ];

        // 3. Data Rows
        $this->tableDataStartRow = count($rows) + 1;

        $internalSum = (float) $this->records->sum('internal_amount');
        $bankSum = (float) $this->records->sum('bank_amount');
        $varianceSum = (float) $this->records->sum('variance');

        if ($this->records->isEmpty()) {
            $rows[] = ['No records found for '.$this->statusLabel.' in the selected period.'];
            $this->tableDataEndRow = count($rows);
        } else {
            foreach ($this->records as $row) {
                $rows[] = [
                    $row->status ?? 'N/A',
                    $row->ref_no ?? 'N/A',
                    $row->is_duplicate ? 'Yes' : 'No',
                    $row->description ?? 'N/A',
                    $row->internal_source ?? 'N/A',
                    $row->internal_date_issued ? Carbon::parse($row->internal_date_issued)->format('Y-m-d') : 'N/A',
                    $row->disbursement_week ? 'Week '.$row->disbursement_week : 'N/A',
                    $row->internal_amount !== null ? (float) $row->internal_amount : null,
                    $row->bank_source ?? 'N/A',
                    $row->bank_date ? Carbon::parse($row->bank_date)->format('F Y') : 'N/A',
                    $row->transaction_date ? Carbon::parse($row->transaction_date)->format('Y-m-d') : 'N/A',
                    $row->bank_amount !== null ? (float) $row->bank_amount : null,
                    $row->variance !== null ? (float) $row->variance : null,
                    $row->days_outstanding !== null ? (int) $row->days_outstanding : 'N/A',
                ];
            }
            $this->tableDataEndRow = count($rows);

            // Total summary row
            $this->totalRow = count($rows) + 1;
            $rows[] = [
                'Total',
                '',
                '',
                '',
                '',
                '',
                '',
                $internalSum,
                '',
                '',
                '',
                $bankSum,
                $varianceSum,
                '',
            ];
        }

        return $rows;
    }

    public function styles(Worksheet $sheet)
    {
        // 1. Ensure default plain font (no bold, standard size) across entire worksheet
        $sheet->getParent()->getDefaultStyle()->applyFromArray([
            'font' => [
                'name' => 'Calibri',
                'size' => 11,
                'bold' => false,
            ],
        ]);

        // 2. Title block (simple, no bold, no colors)
        $sheet->mergeCells('A1:N1');
        $sheet->mergeCells('A2:N2');
        $sheet->mergeCells('A3:N3');

        // 3. Data Table Borders & Formatting
        if ($this->tableHeaderRow > 0) {
            $lastRow = $this->totalRow > 0 ? $this->totalRow : $this->tableDataEndRow;

            // Apply thin black border to the entire data table
            $sheet->getStyle("A{$this->tableHeaderRow}:N{$lastRow}")->applyFromArray([
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => Border::BORDER_THIN,
                        'color' => ['rgb' => '000000'],
                    ],
                ],
            ]);

            // Table header alignment
            $sheet->getStyle("A{$this->tableHeaderRow}:N{$this->tableHeaderRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        }

        // 4. Data rows alignment and currency format
        if ($this->tableDataStartRow > 0 && $this->tableDataEndRow >= $this->tableDataStartRow && ! $this->records->isEmpty()) {
            // Center-aligned columns: Status (A), Check No (B), Duplicate? (C), Date Issued (F), Week (G), Bank Date (J), Trans Date (K), Days Outstanding (N)
            $sheet->getStyle("A{$this->tableDataStartRow}:C{$this->tableDataEndRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("F{$this->tableDataStartRow}:G{$this->tableDataEndRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("J{$this->tableDataStartRow}:K{$this->tableDataEndRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("N{$this->tableDataStartRow}:N{$this->tableDataEndRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

            // Left-aligned columns: Payee (D), Internal Source (E), Bank Source (I)
            $sheet->getStyle("D{$this->tableDataStartRow}:E{$this->tableDataEndRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);
            $sheet->getStyle("I{$this->tableDataStartRow}:I{$this->tableDataEndRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_LEFT);

            // Right-aligned & Number Formatted columns: Internal Amount (H), Bank Amount (L), Variance (M)
            $sheet->getStyle("H{$this->tableDataStartRow}:H{$this->tableDataEndRow}")
                ->getNumberFormat()->setFormatCode('#,##0.00');
            $sheet->getStyle("L{$this->tableDataStartRow}:L{$this->tableDataEndRow}")
                ->getNumberFormat()->setFormatCode('#,##0.00');
            $sheet->getStyle("M{$this->tableDataStartRow}:M{$this->tableDataEndRow}")
                ->getNumberFormat()->setFormatCode('#,##0.00');
        }

        // 5. Total row formatting
        if ($this->totalRow > 0) {
            $sheet->getStyle("H{$this->totalRow}")->getNumberFormat()->setFormatCode('#,##0.00');
            $sheet->getStyle("L{$this->totalRow}")->getNumberFormat()->setFormatCode('#,##0.00');
            $sheet->getStyle("M{$this->totalRow}")->getNumberFormat()->setFormatCode('#,##0.00');
        }

        return [];
    }
}
