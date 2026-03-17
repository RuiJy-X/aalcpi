<?php

require __DIR__ . '/../vendor/autoload.php';

use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

$targetDir = __DIR__ . '/../storage/app/imports';

if (!is_dir($targetDir)) {
    mkdir($targetDir, 0777, true);
}

/**
 * Create an XLSX file with headers and rows.
 *
 * @param string $filePath
 * @param array<int, string> $headers
 * @param array<int, array<int, mixed>> $rows
 */
function createExcelFile(string $filePath, array $headers, array $rows): void
{
    $spreadsheet = new Spreadsheet();
    $sheet = $spreadsheet->getActiveSheet();

    $sheet->fromArray($headers, null, 'A1');

    foreach ($rows as $index => $row) {
        $sheet->fromArray($row, null, 'A' . ($index + 2));
    }

    (new Xlsx($spreadsheet))->save($filePath);
}

$rowCount = 10;

$planterHeaders = [
    'planter_code',
    'name',
    'address',
    'contact_number',
    'tin_number',
    'registration_date',
    'hacienda_code',
    'hacienda_name',
    'hacienda_address',
    'area_hectares',
    'distance_from_urc',
];

$planterRows = [];
for ($i = 1; $i <= $rowCount; $i++) {
    $planterRows[] = [
        'PLN-' . str_pad((string) $i, 3, '0', STR_PAD_LEFT),
        'Planter ' . $i,
        'Barangay Sample ' . $i,
        '09' . str_pad((string) (100000000 + $i), 9, '0', STR_PAD_LEFT),
        'TIN-' . str_pad((string) $i, 6, '0', STR_PAD_LEFT),
        date('Y-m-d', strtotime('2025-01-01 +' . ($i - 1) . ' days')),
        'HAC-' . str_pad((string) $i, 3, '0', STR_PAD_LEFT),
        'Hacienda ' . $i,
        'Hacienda Address ' . $i,
        5 + $i,
        1.5 + ($i * 0.25),
    ];
}

$productionHeaders = [
    'planter_code',
    'planter_name',
    'hacienda_code',
    'hacienda_name',
    'production_year',
    'production_month',
    'gross_cw',
    'net_cw',
    'trucks',
    'theoretical_lkg',
    'actual_lkg',
    'pshr_net_lkg',
    'pdpa_lkg',
    'association_dues_lkg',
    'actual_mol',
    'pshr_net_mol',
    'pdpa_mol',
    'association_dues_mol',
    'trans_code',
    'transloading',
];

$productionRows = [];
for ($i = 1; $i <= $rowCount; $i++) {
    $productionRows[] = [
        'PLN-' . str_pad((string) $i, 3, '0', STR_PAD_LEFT),
        'Planter ' . $i,
        'HAC-' . str_pad((string) $i, 3, '0', STR_PAD_LEFT),
        'Hacienda ' . $i,
        2025,
        'January',
        120 + $i,
        115 + $i,
        2 + ($i % 3),
        450 + ($i * 2),
        440 + ($i * 2),
        430 + ($i * 2),
        10 + ($i * 0.5),
        5 + ($i * 0.25),
        200 + ($i * 1.5),
        195 + ($i * 1.25),
        3 + ($i * 0.2),
        2 + ($i * 0.15),
        'TRX' . str_pad((string) $i, 4, '0', STR_PAD_LEFT),
        $i % 2 === 0 ? 'true' : 'false',
    ];
}

$planterFile = $targetDir . '/planter_sample.xlsx';
$productionFile = $targetDir . '/productions_sample.xlsx';

createExcelFile($planterFile, $planterHeaders, $planterRows);
createExcelFile($productionFile, $productionHeaders, $productionRows);

echo "Created sample files:\n";
echo "- {$planterFile}\n";
echo "- {$productionFile}\n";
