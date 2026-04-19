<?php

require __DIR__ . '/../vendor/autoload.php';

use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

$targetDir = __DIR__ . '/../storage/app/imports';

if (!is_dir($targetDir)) {
    mkdir($targetDir, 0777, true);
}

$filePath = $targetDir . '/raw_data_sample.xlsx';
$rowCount = 25;

$headers = [
    'crop_year',
    'date',
    'planter_code',
    'gross_cw',
    'net_cw',
    'trucks',
    'theoretical_lkg',
    'actual_lkg',
    'calculated_sugar',
    'trash',
    'Lkg_per_TC',
];

$rows = [];
for ($i = 1; $i <= $rowCount; $i++) {
    $grossCw = round(mt_rand(3000, 11000) / 100, 3);
    $netCw = round(max(0, $grossCw - (mt_rand(0, 300) / 100)), 3);
    $lkgPerTc = round(mt_rand(60, 280) / 100, 3);

    $rows[] = [
        '2025-2026',
        date('Y-m-d', strtotime('2026-01-01 +' . ($i - 1) . ' days')),
        'P-' . str_pad((string) $i, 6, '0', STR_PAD_LEFT),
        $grossCw,
        $netCw,
        mt_rand(1, 12),
        round($netCw * $lkgPerTc, 3),
        round(max(0, ($netCw * $lkgPerTc) - (mt_rand(0, 150) / 100)), 3),
        round($grossCw * $lkgPerTc, 3),
        round(mt_rand(0, 1000) / 100, 3),
        $lkgPerTc,
    ];
}

$spreadsheet = new Spreadsheet();
$sheet = $spreadsheet->getActiveSheet();
$sheet->fromArray($headers, null, 'A1');

foreach ($rows as $index => $row) {
    $sheet->fromArray($row, null, 'A' . ($index + 2));
}

(new Xlsx($spreadsheet))->save($filePath);

echo "Created sample file:\n";
echo "- {$filePath}\n";
