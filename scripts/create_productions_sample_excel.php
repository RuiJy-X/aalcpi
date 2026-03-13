<?php

require __DIR__ . '/../vendor/autoload.php';

use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

$targetDir = __DIR__ . '/../storage/app/imports';
$targetFile = $targetDir . '/productions_sample.xlsx';

if (!is_dir($targetDir)) {
    mkdir($targetDir, 0777, true);
}

$spreadsheet = new Spreadsheet();
$sheet = $spreadsheet->getActiveSheet();

$headers = [
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

$row = [
    'PLN-001',
    'Juan Dela Cruz',
    'HAC-001',
    'Hacienda Uno',
    2025,
    'January',
    123.45,
    120.00,
    2,
    456.78,
    450.10,
    440.00,
    10.10,
    5.55,
    200.25,
    195.00,
    3.10,
    2.15,
    'TRX001',
    'true',
];

$sheet->fromArray($headers, null, 'A1');
$sheet->fromArray($row, null, 'A2');

(new Xlsx($spreadsheet))->save($targetFile);

echo "Created sample file: {$targetFile}" . PHP_EOL;
