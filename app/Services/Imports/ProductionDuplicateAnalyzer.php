<?php

namespace App\Services\Imports;

use App\Models\Hacienda;
use App\Models\Planter;
use App\Models\Production;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use PhpOffice\PhpSpreadsheet\IOFactory;

class ProductionDuplicateAnalyzer
{
    /**
     * Analyze a production spreadsheet against the database.
     *
     * @param  string  $filePath  Path to file on local storage disk
     * @param  array<string, mixed>  $batchContext  ['crop_year' => ..., 'composite_sugar_price' => ..., 'composite_molasses_price' => ...]
     * @param  array<string, string>  $mapping  Column mapping [targetField => sourceHeader]
     * @return array<string, mixed>
     */
    public function analyze(
        string $filePath,
        array $batchContext,
        array $mapping = []
    ): array {
        $fullPath = Storage::disk('local')->path($filePath);
        $headingRow = 1;
        $cropYear = (string) ($batchContext['crop_year'] ?? '');

        $rows = $this->extractRowsWithHeaders($fullPath, $headingRow);
        $headerKeys = $rows['headers'];
        $dataRows = $rows['data'];

        $totalRows = 0;
        $newRowsCount = 0;
        $exactDuplicatesCount = 0;
        $possibleDuplicatesCount = 0;
        $invalidRowsCount = 0;

        $possibleDuplicates = [];
        $newRowsSample = [];
        $exactDuplicatesSample = [];
        $invalidRows = [];

        $seenInBatch = [];

        $toNum = fn ($val) => is_numeric($val) ? (float) $val : 0.0;
        $toBool = fn ($val) => filter_var($val, FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE) ?? false;
        $toMolValue = function ($val): float {
            if ($val === null || $val === '') {
                return 0.0;
            }
            $raw = trim((string) $val);
            $hasDecimal = str_contains($raw, '.') || str_contains($raw, ',');
            $normalized = str_replace(',', '.', $raw);
            if (! is_numeric($normalized)) {
                return 0.0;
            }
            $num = (float) $normalized;

            return $hasDecimal ? $num : $num / 1000;
        };

        foreach ($dataRows as $index => $rawRow) {
            $rowNum = $index + $headingRow + 1;

            $hasAnyContent = false;
            foreach ($rawRow as $val) {
                if ($val !== null && trim((string) $val) !== '') {
                    $hasAnyContent = true;
                    break;
                }
            }

            if (! $hasAnyContent) {
                continue;
            }

            $rowMapped = $this->applyMapping($rawRow, $mapping);

            // Validate required identifiers
            $rawPlanterCode = $rowMapped['planter_code'] ?? $rowMapped['Pcode'] ?? '';
            $rawHaciendaCode = $rowMapped['hacienda_code'] ?? $rowMapped['Hcode'] ?? '';

            if (empty($rawPlanterCode)) {
                $invalidRowsCount++;
                $invalidRows[] = [
                    'row_number' => $rowNum,
                    'reason' => 'Planter code is empty.',
                ];
                continue;
            }

            $planterCode = $this->padCode($rawPlanterCode);
            $haciendaCode = $this->padCode($rawHaciendaCode);

            $netCw = $toNum($rowMapped['net_cw'] ?? $rowMapped['Tonnes Net'] ?? 0);
            $actualLkg = $toNum($rowMapped['actual_lkg'] ?? $rowMapped['Total Sugar'] ?? 0);
            $grossCw = $toNum($rowMapped['gross_cw'] ?? 0);
            $theoLkg = $toNum($rowMapped['theoretical_lkg'] ?? $rowMapped['theo_lkg'] ?? 0);
            $pshrNetLkg = $toNum($rowMapped['pshr_net_lkg'] ?? $rowMapped['pshr_net_sugar'] ?? $rowMapped['planter_share_sugar'] ?? $rowMapped['Sugar (64%)'] ?? 0);
            $actualMol = $toMolValue($rowMapped['re actual_mol'] ?? $rowMapped['actual_mol'] ?? $rowMapped['Total Mol'] ?? 0);
            $pshrNetMol = $toMolValue($rowMapped['re pshr_net_mol'] ?? $rowMapped['pshr_net_mol'] ?? $rowMapped['Pshr_Net_Mol'] ?? $rowMapped['Mol (64%)'] ?? 0);
            $pdpaLkg = $toNum($rowMapped['pdpa_lkg'] ?? 0);
            $pdpaMol = $toMolValue($rowMapped['re_pdpa_mol'] ?? $rowMapped['pdpa_mol'] ?? 0);
            $duesLkg = $toNum($rowMapped['assn_dues_lkg'] ?? $rowMapped['assn_dues_sugar'] ?? 0);
            $duesMol = $toNum($rowMapped['Assn_Dues_Mol'] ?? $rowMapped['assn_dues_mol'] ?? $rowMapped['re assn_dues_mol'] ?? 0);
            $trucks = (int) ($rowMapped['trucks'] ?? 0);
            $transCode = (string) ($rowMapped['trans_code'] ?? '0');
            $planterName = $rowMapped['planter_name'] ?? $rowMapped['Pname'] ?? $rowMapped['Planter Name'] ?? 'Unknown Planter';
            $haciendaName = $rowMapped['hacienda_name'] ?? $rowMapped['Hacienda Name'] ?? 'Unknown Hacienda';

            $totalRows++;
            $rowId = 'row_'.$rowNum;
            $signatureKey = sprintf('%s:%s:%s', $planterCode, $haciendaCode, $cropYear);

            $importedRecord = [
                'row_id' => $rowId,
                'row_number' => $rowNum,
                'planter_code' => $planterCode,
                'hacienda_code' => $haciendaCode,
                'planter_name' => $planterName,
                'hacienda_name' => $haciendaName,
                'crop_year' => $cropYear,
                'net_cw' => $netCw,
                'actual_lkg' => $actualLkg,
                'gross_cw' => $grossCw,
                'pshr_net_lkg' => $pshrNetLkg,
                'actual_mol' => $actualMol,
                'pshr_net_mol' => $pshrNetMol,
                'trucks' => $trucks,
                'trans_code' => $transCode,
            ];

            // 1. Query database candidate
            $existing = Production::query()
                ->where('planter_code', $planterCode)
                ->where('hacienda_code', $haciendaCode)
                ->where('crop_year', $cropYear)
                ->first();

            // 2. Exact Duplicate Check
            $exactMatch = false;
            if ($existing) {
                $netCwMatch = abs((float) $existing->net_cw - $netCw) < 0.001;
                $actualLkgMatch = abs((float) $existing->actual_lkg - $actualLkg) < 0.001;
                $pshrLkgMatch = abs((float) $existing->pshr_net_lkg - $pshrNetLkg) < 0.001;
                $actualMolMatch = abs((float) $existing->actual_mol - $actualMol) < 0.001;
                $pshrMolMatch = abs((float) $existing->pshr_net_mol - $pshrNetMol) < 0.001;
                $grossCwMatch = abs((float) $existing->gross_cw - $grossCw) < 0.001;
                $trucksMatch = (int) $existing->trucks === $trucks;

                $exactMatch = $netCwMatch && $actualLkgMatch && $pshrLkgMatch && $actualMolMatch && $pshrMolMatch && $grossCwMatch && $trucksMatch;
            }

            $intraBatchExact = isset($seenInBatch[$signatureKey]) &&
                abs($seenInBatch[$signatureKey]['net_cw'] - $netCw) < 0.001 &&
                abs($seenInBatch[$signatureKey]['actual_lkg'] - $actualLkg) < 0.001;

            if ($exactMatch || $intraBatchExact) {
                $exactDuplicatesCount++;
                $isPrior = $intraBatchExact && ! $exactMatch;
                if (count($exactDuplicatesSample) < 5) {
                    $exactDuplicatesSample[] = [
                        'row_number' => $rowNum,
                        'planter_code' => $planterCode,
                        'hacienda_code' => $haciendaCode,
                        'planter_name' => $planterName,
                        'net_cw' => $netCw,
                        'actual_lkg' => $actualLkg,
                        'matched_existing_id' => $exactMatch ? $existing?->id : null,
                        'matched_prior_row' => $isPrior ? ($seenInBatch[$signatureKey]['row_number'] ?? null) : null,
                    ];
                }
                $seenInBatch[$signatureKey] = $importedRecord;
                continue;
            }

            // 3. Possible Duplicate Check (identifier matches, but tonnage / metrics differ)
            if ($existing || isset($seenInBatch[$signatureKey])) {
                $possibleDuplicatesCount++;
                $differences = [];

                if ($existing) {
                    if (abs((float) $existing->net_cw - $netCw) >= 0.001) {
                        $differences[] = [
                            'field' => 'net_cw',
                            'label' => 'Net Tonnes (CW)',
                            'existing' => number_format((float) $existing->net_cw, 3),
                            'imported' => number_format($netCw, 3),
                        ];
                    }
                    if (abs((float) $existing->actual_lkg - $actualLkg) >= 0.001) {
                        $differences[] = [
                            'field' => 'actual_lkg',
                            'label' => 'Actual Sugar (Lkg)',
                            'existing' => number_format((float) $existing->actual_lkg, 3),
                            'imported' => number_format($actualLkg, 3),
                        ];
                    }
                    if (abs((float) $existing->pshr_net_lkg - $pshrNetLkg) >= 0.001) {
                        $differences[] = [
                            'field' => 'pshr_net_lkg',
                            'label' => 'Planter Sugar Share (Lkg)',
                            'existing' => number_format((float) $existing->pshr_net_lkg, 3),
                            'imported' => number_format($pshrNetLkg, 3),
                        ];
                    }
                    if (abs((float) $existing->actual_mol - $actualMol) >= 0.001) {
                        $differences[] = [
                            'field' => 'actual_mol',
                            'label' => 'Actual Molasses (Kg)',
                            'existing' => number_format((float) $existing->actual_mol, 3),
                            'imported' => number_format($actualMol, 3),
                        ];
                    }
                    if (abs((float) $existing->pshr_net_mol - $pshrNetMol) >= 0.001) {
                        $differences[] = [
                            'field' => 'pshr_net_mol',
                            'label' => 'Planter Molasses Share (Kg)',
                            'existing' => number_format((float) $existing->pshr_net_mol, 3),
                            'imported' => number_format($pshrNetMol, 3),
                        ];
                    }
                    if ((int) $existing->trucks !== $trucks) {
                        $differences[] = [
                            'field' => 'trucks',
                            'label' => 'Trucks Count',
                            'existing' => (string) $existing->trucks,
                            'imported' => (string) $trucks,
                        ];
                    }
                } else {
                    $prior = $seenInBatch[$signatureKey];
                    if (abs($prior['net_cw'] - $netCw) >= 0.001) {
                        $differences[] = [
                            'field' => 'net_cw',
                            'label' => 'Net Tonnes (CW) (Prior row in file)',
                            'existing' => number_format($prior['net_cw'], 3),
                            'imported' => number_format($netCw, 3),
                        ];
                    }
                }

                $possibleDuplicates[] = [
                    'row_id' => $rowId,
                    'row_number' => $rowNum,
                    'identifier' => "Planter {$planterCode} / Hda {$haciendaCode} ({$planterName})",
                    'existing_id' => $existing?->id,
                    'existing_record' => $existing ? [
                        'id' => $existing->id,
                        'planter_code' => $existing->planter_code,
                        'hacienda_code' => $existing->hacienda_code,
                        'net_cw' => $existing->net_cw,
                        'actual_lkg' => $existing->actual_lkg,
                        'pshr_net_lkg' => $existing->pshr_net_lkg,
                        'actual_mol' => $existing->actual_mol,
                        'pshr_net_mol' => $existing->pshr_net_mol,
                    ] : null,
                    'imported_record' => $importedRecord,
                    'differences' => $differences,
                    'default_action' => 'update',
                ];

                $seenInBatch[$signatureKey] = $importedRecord;
                continue;
            }

            // 4. Brand New Row
            $newRowsCount++;
            if (count($newRowsSample) < 5) {
                $newRowsSample[] = [
                    'row_number' => $rowNum,
                    'planter_code' => $planterCode,
                    'hacienda_code' => $haciendaCode,
                    'planter_name' => $planterName,
                    'net_cw' => $netCw,
                    'actual_lkg' => $actualLkg,
                ];
            }
            $seenInBatch[$signatureKey] = $importedRecord;
        }

        $analysisToken = (string) Str::uuid();
        $stagedPath = "imports/productions/staging/{$analysisToken}.xlsx";
        Storage::disk('local')->put($stagedPath, Storage::disk('local')->get($filePath));

        $result = [
            'analysis_token' => $analysisToken,
            'file_name' => basename($filePath),
            'type' => 'productions',
            'heading_row' => $headingRow,
            'headers_read' => $headerKeys,
            'total_rows' => $totalRows + $invalidRowsCount,
            'new_rows_count' => $newRowsCount,
            'exact_duplicates_count' => $exactDuplicatesCount,
            'possible_duplicates_count' => $possibleDuplicatesCount,
            'invalid_rows_count' => $invalidRowsCount,
            'possible_duplicates' => $possibleDuplicates,
            'new_rows_sample' => $newRowsSample,
            'exact_duplicates_sample' => $exactDuplicatesSample,
            'invalid_rows' => $invalidRows,
            'batch_context' => $batchContext,
            'staged_path' => $stagedPath,
        ];

        Cache::put("production_analysis_{$analysisToken}", $result, now()->addHours(2));

        return $result;
    }

    /**
     * Retrieve a cached analysis result by token.
     */
    public function getCachedAnalysis(string $token): ?array
    {
        return Cache::get("production_analysis_{$token}");
    }

    /**
     * Clear cached analysis.
     */
    public function clearCachedAnalysis(string $token): void
    {
        Cache::forget("production_analysis_{$token}");
    }

    /**
     * Read spreadsheet rows and headers starting from specified heading row (1-indexed).
     *
     * @return array{headers: string[], data: array<int, array<string, mixed>>}
     */
    private function extractRowsWithHeaders(string $fullPath, int $headingRow): array
    {
        $spreadsheet = IOFactory::load($fullPath);
        $sheet = $spreadsheet->getSheet(0);
        $highestRow = $sheet->getHighestRow();
        $highestColumn = $sheet->getHighestColumn();

        // 1. Read header row
        $headerValues = $sheet->rangeToArray("A{$headingRow}:{$highestColumn}{$headingRow}", null, true, false)[0] ?? [];
        $headers = [];

        foreach ($headerValues as $colIndex => $value) {
            $stringValue = is_string($value) ? trim($value) : (string) $value;
            if ($stringValue === '') {
                $headers[$colIndex] = 'column_'.$colIndex;
                continue;
            }
            $headers[$colIndex] = Str::of($stringValue)->slug('_')->lower()->toString();
        }

        // 2. Read data rows
        $data = [];
        $startDataRow = $headingRow + 1;

        if ($startDataRow <= $highestRow) {
            $rawRows = $sheet->rangeToArray("A{$startDataRow}:{$highestColumn}{$highestRow}", null, true, false);

            foreach ($rawRows as $row) {
                $mappedRow = [];
                foreach ($headers as $colIndex => $headerName) {
                    $mappedRow[$headerName] = $row[$colIndex] ?? null;
                }
                $data[] = $mappedRow;
            }

            // Trim trailing completely empty rows after the last row with actual data
            $lastDataIndex = -1;
            foreach ($data as $i => $r) {
                foreach ($r as $val) {
                    if ($val !== null && trim((string) $val) !== '') {
                        $lastDataIndex = $i;
                        break;
                    }
                }
            }
            if ($lastDataIndex >= 0) {
                $data = array_slice($data, 0, $lastDataIndex + 1);
            }
        }

        return [
            'headers' => array_values(array_filter($headers, fn ($h) => ! str_starts_with($h, 'column_'))),
            'data' => $data,
        ];
    }

    /**
     * Map row headers according to user-specified mapping.
     */
    private function applyMapping(array $row, array $mapping): array
    {
        if (empty($mapping)) {
            return $row;
        }

        $mapped = [];
        foreach ($mapping as $target => $source) {
            if (! is_string($source) || $source === '') {
                continue;
            }

            $mapped[$target] = $row[$source] ?? null;
        }

        return array_merge($row, $mapped);
    }

    private function padCode($code): string
    {
        if (is_null($code) || $code === '') {
            return '00000';
        }

        return str_pad((string) trim((string) $code), 5, '0', STR_PAD_LEFT);
    }
}
