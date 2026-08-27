<?php

namespace App\Imports;

use App\Models\Hacienda;
use App\Models\ImportJob;
use App\Models\Planter;
use App\Models\Production;
use Illuminate\Support\Facades\Storage;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithChunkReading;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Events\AfterImport;
use Maatwebsite\Excel\Events\ImportFailed;

class ProductionsImport implements ToModel, WithChunkReading, WithEvents, WithHeadingRow
{
    protected int $rowsRead = 0;

    protected int $rowsSaved = 0;

    protected int $rowsSkipped = 0;

    protected int $invalidRowsCount = 0;

    protected int $newRowsCount = 0;

    protected int $exactDuplicatesCount = 0;

    protected int $possibleDuplicatesUpdated = 0;

    protected int $possibleDuplicatesReplaced = 0;

    protected array $warnings = [];

    protected array $headersRead = [];

    protected int $plantersCreatedCount = 0;

    protected int $haciendasCreatedCount = 0;

    protected float $totalNetCw = 0.0;

    protected float $totalActualLkg = 0.0;

    protected array $seenInBatch = [];

    public function __construct(
        private readonly string $importCropYear,
        private readonly array $mapping = [],
        private readonly ?float $compositeSugarPrice = null,
        private readonly ?float $compositeMolassesPrice = null,
        private readonly ?int $importJobId = null,
        private readonly ?string $storedPath = null,
        private readonly array $duplicateResolutions = []
    ) {}

    public function headingRow(): int
    {
        return 1;
    }

    public function model(array $row)
    {
        $hasAnyContent = false;
        foreach ($row as $val) {
            if ($val !== null && trim((string) $val) !== '') {
                $hasAnyContent = true;
                break;
            }
        }

        if (! $hasAnyContent) {
            return null;
        }

        $this->rowsRead++;
        if (empty($this->headersRead)) {
            $this->headersRead = array_keys($row);
        }

        $rowNum = $this->rowsRead + $this->headingRow();
        $rowMapped = $this->applyMapping($row);

        // 1. SKIP EMPTY ROWS
        $rawPlanterCode = $rowMapped['planter_code'] ?? $rowMapped['Pcode'] ?? '';
        $rawHaciendaCode = $rowMapped['hacienda_code'] ?? $rowMapped['Hcode'] ?? '';

        if (empty($rawPlanterCode)) {
            $this->invalidRowsCount++;
            $this->rowsSkipped++;
            $this->warnings[] = "Row {$rowNum}: Skipped row (Planter code is empty).";

            return null;
        }

        // 2. HELPERS for numeric values
        $toNum = fn ($val) => is_numeric($val) ? (float) $val : 0.0;
        $toBool = fn ($val) => filter_var($val, FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE) ?? false;
        $toNullablePrice = fn ($val) => ($val === null || $val === '')
            ? null
            : (is_numeric($val) ? (float) $val : null);
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

        // 3. PAD CODES to 5 digits with leading zeros
        $planterCode = $this->padCode($rawPlanterCode);
        $haciendaCode = $this->padCode($rawHaciendaCode);

        // 4. PLANTER
        $planterExists = Planter::where('planter_code', $planterCode)->exists();
        $planter = Planter::updateOrCreate(
            ['planter_code' => $planterCode],
            [
                'name' => $rowMapped['planter_name'] ?? $rowMapped['Pname'] ?? $rowMapped['Planter Name'] ?? 'Unknown Planter',
                'registration_date' => now(),
            ]
        );
        if (! $planterExists && $planter->wasRecentlyCreated) {
            $this->plantersCreatedCount++;
        }

        // 5. HACIENDA
        $haciendaExists = Hacienda::where('hacienda_code', $haciendaCode)->exists();
        $hacienda = Hacienda::updateOrCreate(
            ['hacienda_code' => $haciendaCode],
            [
                'planter_id' => $planter->id,
                'name' => $rowMapped['hacienda_name'] ?? $rowMapped['Hacienda Name'] ?? 'Unknown Hacienda',
                'is_active' => true,
            ]
        );
        if (! $haciendaExists && $hacienda->wasRecentlyCreated) {
            $this->haciendasCreatedCount++;
        }

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
        $transloading = $toBool($rowMapped['transloading'] ?? false);

        $rowId = 'row_'.$rowNum;
        $signatureKey = sprintf('%s:%s:%s', $planterCode, $haciendaCode, $this->importCropYear);

        $productionAttributes = [
            'import_job_id' => $this->importJobId,
            'trucks' => $trucks,
            'trans_code' => $transCode,
            'planter_id' => $planter->id,
            'hacienda_id' => $hacienda->id,
            'gross_cw' => $grossCw,
            'net_cw' => $netCw,
            'pdpa_lkg' => $pdpaLkg,
            'actual_lkg' => $actualLkg,
            'theoretical_lkg' => $theoLkg,
            'pshr_net_lkg' => $pshrNetLkg,
            'actual_mol' => $actualMol,
            'pshr_net_mol' => $pshrNetMol,
            'pdpa_mol' => $pdpaMol,
            'association_dues_lkg' => $duesLkg,
            'association_dues_mol' => $duesMol,
            'composite_sugar_price' => $toNullablePrice($this->compositeSugarPrice),
            'composite_molasses_price' => $toNullablePrice($this->compositeMolassesPrice),
            'transloading' => $transloading,
        ];

        // Query existing production record
        $existing = Production::query()
            ->where('planter_code', $planterCode)
            ->where('hacienda_code', $haciendaCode)
            ->where('crop_year', $this->importCropYear)
            ->first();

        // Check Exact Duplicate
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

        $intraBatchExact = isset($this->seenInBatch[$signatureKey]) &&
            abs($this->seenInBatch[$signatureKey]['net_cw'] - $netCw) < 0.001 &&
            abs($this->seenInBatch[$signatureKey]['actual_lkg'] - $actualLkg) < 0.001;

        if ($exactMatch || $intraBatchExact) {
            // AUTOMATICALLY SKIP EXACT DUPLICATE
            $this->exactDuplicatesCount++;
            $this->rowsSkipped++;
            $this->seenInBatch[$signatureKey] = [
                'net_cw' => $netCw,
                'actual_lkg' => $actualLkg,
            ];

            return null;
        }

        // Check Possible Duplicate
        if ($existing) {
            $resolution = $this->duplicateResolutions[$rowId] ?? 'update';

            $existing->update($productionAttributes);
            if ($resolution === 'replace') {
                $this->possibleDuplicatesReplaced++;
            } else {
                $this->possibleDuplicatesUpdated++;
            }

            $this->totalNetCw += $netCw;
            $this->totalActualLkg += $actualLkg;
            $this->rowsSaved++;
            $this->seenInBatch[$signatureKey] = [
                'net_cw' => $netCw,
                'actual_lkg' => $actualLkg,
            ];

            return null;
        }

        // New Row
        $this->newRowsCount++;
        $this->totalNetCw += $netCw;
        $this->totalActualLkg += $actualLkg;
        $this->rowsSaved++;
        $this->seenInBatch[$signatureKey] = [
            'net_cw' => $netCw,
            'actual_lkg' => $actualLkg,
        ];

        return Production::create(array_merge([
            'planter_code' => $planterCode,
            'hacienda_code' => $haciendaCode,
            'crop_year' => $this->importCropYear,
        ], $productionAttributes));
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
                    $importJob = ImportJob::find($this->importJobId);

                    if ($importJob) {
                        $possibleDuplicatesTotal = $this->possibleDuplicatesUpdated + $this->possibleDuplicatesReplaced;

                        $context = array_merge($importJob->context ?? [], [
                            'heading_row' => $this->headingRow(),
                            'headers_read' => $this->headersRead,
                            'rows_read' => $this->rowsRead,
                            'rows_saved' => $this->rowsSaved,
                            'rows_skipped' => $this->rowsSkipped,
                            'new_rows_count' => $this->newRowsCount,
                            'exact_duplicates_count' => $this->exactDuplicatesCount,
                            'invalid_rows_count' => $this->invalidRowsCount,
                            'possible_duplicates_count' => $possibleDuplicatesTotal,
                            'updated_count' => $this->possibleDuplicatesUpdated,
                            'replaced_count' => $this->possibleDuplicatesReplaced,
                            'warnings' => $this->warnings,
                            'crop_year' => $this->importCropYear,
                            'composite_sugar_price' => $this->compositeSugarPrice,
                            'composite_molasses_price' => $this->compositeMolassesPrice,
                            'planters_created' => $this->plantersCreatedCount,
                            'haciendas_created' => $this->haciendasCreatedCount,
                            'total_net_cw' => round($this->totalNetCw, 3),
                            'total_actual_lkg' => round($this->totalActualLkg, 3),
                        ]);

                        $message = "Import complete. {$this->rowsSaved} production rows imported/updated. Skipped {$this->rowsSkipped} rows total ({$this->exactDuplicatesCount} exact duplicates skipped, {$this->invalidRowsCount} invalid rows skipped).";

                        $importJob->update([
                            'status' => ImportJob::STATUS_DONE,
                            'finished_at' => now(),
                            'context' => $context,
                            'message' => $message,
                        ]);
                    }
                }

                if ($this->storedPath) {
                    Storage::disk('local')->delete($this->storedPath);
                }
            },
            ImportFailed::class => function (ImportFailed $event): void {
                if ($this->importJobId !== null) {
                    $importJob = ImportJob::find($this->importJobId);
                    if ($importJob) {
                        $context = array_merge($importJob->context ?? [], [
                            'heading_row' => $this->headingRow(),
                            'rows_read' => $this->rowsRead,
                            'rows_saved' => $this->rowsSaved,
                            'rows_skipped' => $this->rowsSkipped,
                            'exact_duplicates_count' => $this->exactDuplicatesCount,
                            'invalid_rows_count' => $this->invalidRowsCount,
                            'warnings' => $this->warnings,
                            'error' => $event->getException()->getMessage(),
                        ]);

                        $importJob->update([
                            'status' => ImportJob::STATUS_FAILED,
                            'finished_at' => now(),
                            'context' => $context,
                            'message' => $event->getException()->getMessage(),
                        ]);
                    }
                }

                if ($this->storedPath) {
                    Storage::disk('local')->delete($this->storedPath);
                }
            },
        ];
    }

    private function applyMapping(array $row): array
    {
        if (empty($this->mapping)) {
            return $row;
        }

        $mapped = [];
        foreach ($this->mapping as $target => $source) {
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
