<?php

namespace App\Imports;

use App\Models\Hacienda;
use App\Models\ImportJob;
use App\Models\Planter;
use App\Models\Production;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Storage;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithChunkReading;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Events\AfterImport;
use Maatwebsite\Excel\Events\ImportFailed;

class ProductionsImport implements ToModel, WithHeadingRow, WithChunkReading, WithEvents
{
    protected int $rowsRead = 0;
    protected int $rowsSaved = 0;
    protected int $rowsSkipped = 0;
    protected array $warnings = [];
    protected array $headersRead = [];
    protected int $plantersCreatedCount = 0;
    protected int $haciendasCreatedCount = 0;
    protected float $totalNetCw = 0.0;
    protected float $totalActualLkg = 0.0;

    public function __construct(
        private readonly string $importCropYear,
        private readonly array $mapping = [],
        private readonly float | null $compositeSugarPrice = null,
        private readonly float | null $compositeMolassesPrice = null,
        private readonly ?int $importJobId = null,
        private readonly ?string $storedPath = null,
    ) {}

    public function headingRow(): int
    {
        return 1;
    }

    public function model(array $row)
    {
        $this->rowsRead++;
        if (empty($this->headersRead)) {
            $this->headersRead = array_keys($row);
        }

        $rowNum = $this->rowsRead + $this->headingRow();
        $rowMapped = $this->applyMapping($row);

        // 1. SKIP EMPTY ROWS (Critical to avoid Not Null Violation)
        if (empty($rowMapped['planter_code']) && empty($rowMapped['Pcode'])) {
            $this->rowsSkipped++;
            $this->warnings[] = "Row {$rowNum}: Skipped row (Planter code is empty).";
            return null;
        }

        // 2. HELPERS for numeric values
        $toNum = fn($val) => is_numeric($val) ? (float) $val : 0;
        $toBool = fn($val) => filter_var($val, FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE) ?? false;
        $toNullablePrice = fn($val) => ($val === null || $val === '')
            ? null
            : (is_numeric($val) ? (float) $val : null);
        $toMolValue = function ($val): float {
            if ($val === null || $val === '') {
                return 0;
            }

            $raw = trim((string) $val);
            $hasDecimal = str_contains($raw, '.') || str_contains($raw, ',');
            $normalized = str_replace(',', '.', $raw);

            if (!is_numeric($normalized)) {
                return 0;
            }

            $num = (float) $normalized;

            // If no decimal separator, assume the value is in thousandths.
            return $hasDecimal ? $num : $num / 1000;
        };

        // 3. PAD CODES to 5 digits with leading zeros
        $planterCode = $this->padCode($rowMapped['planter_code'] ?? $rowMapped['Pcode'] ?? '0');
        $haciendaCode = $this->padCode($rowMapped['hacienda_code'] ?? $rowMapped['Hcode'] ?? '0');

        // 4. PLANTER
        $planterExists = Planter::where('planter_code', $planterCode)->exists();
        $planter = Planter::updateOrCreate(
            ['planter_code' => $planterCode],
            [
                'name' => $rowMapped['planter_name'] ?? $rowMapped['Pname'] ?? $rowMapped['Planter Name'] ?? 'Unknown Planter',
                'registration_date' => now(),
            ]
        );
        if (!$planterExists && $planter->wasRecentlyCreated) {
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
        if (!$haciendaExists && $hacienda->wasRecentlyCreated) {
            $this->haciendasCreatedCount++;
        }

        $netCw = $toNum($rowMapped['net_cw'] ?? $rowMapped['Tonnes Net'] ?? 0);
        $actualLkg = $toNum($rowMapped['actual_lkg'] ?? $rowMapped['Total Sugar'] ?? 0);

        $this->totalNetCw += $netCw;
        $this->totalActualLkg += $actualLkg;
        $this->rowsSaved++;

        // 6. PRODUCTION
        return Production::updateOrCreate(
            [
                'planter_code'  => $planterCode,
                'hacienda_code' => $haciendaCode,
                'crop_year'     => $this->importCropYear,
            ],
            [
                'import_job_id'        => $this->importJobId,
                'trucks'               => (int) ($rowMapped['trucks'] ?? 0),
                'trans_code'           => $rowMapped['trans_code'] ?? '0',
                'planter_id'           => $planter->id,
                'hacienda_id'          => $hacienda->id,
                'gross_cw'             => $toNum($rowMapped['gross_cw'] ?? 0),
                'net_cw'               => $netCw,
                'pdpa_lkg'             => $toNum($rowMapped['pdpa_lkg'] ?? 0),
                'actual_lkg'           => $actualLkg,
                'theoretical_lkg'      => $toNum($rowMapped['theoretical_lkg'] ?? $rowMapped['theo_lkg'] ?? 0),
                'pshr_net_lkg'         => $toNum($rowMapped['pshr_net_lkg'] ?? $rowMapped['pshr_net_sugar'] ?? $rowMapped['planter_share_sugar'] ?? $rowMapped['Sugar (64%)'] ?? 0),
                'actual_mol'           => $toMolValue($rowMapped['re actual_mol'] ?? $rowMapped['actual_mol'] ?? $rowMapped['Total Mol'] ?? 0),
                'pshr_net_mol'         => $toMolValue($rowMapped['re pshr_net_mol'] ?? $rowMapped['pshr_net_mol'] ?? $rowMapped['Pshr_Net_Mol'] ?? $rowMapped['Mol (64%)'] ?? 0),
                'pdpa_mol'             => $toMolValue($rowMapped['re_pdpa_mol'] ?? $rowMapped['pdpa_mol'] ?? 0),
                'association_dues_lkg' => $toNum($rowMapped['assn_dues_lkg'] ?? $rowMapped['assn_dues_sugar'] ?? 0),
                'association_dues_mol' => $toNum($rowMapped['Assn_Dues_Mol'] ?? $rowMapped['assn_dues_mol'] ?? $rowMapped['re assn_dues_mol'] ?? 0),
                'composite_sugar_price' => $toNullablePrice($this->compositeSugarPrice),
                'composite_molasses_price' => $toNullablePrice($this->compositeMolassesPrice),
                'transloading'         => $toBool($rowMapped['transloading'] ?? false),
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
                    $importJob = ImportJob::find($this->importJobId);

                    if ($importJob) {
                        $context = array_merge($importJob->context ?? [], [
                            'heading_row' => $this->headingRow(),
                            'headers_read' => $this->headersRead,
                            'rows_read' => $this->rowsRead,
                            'rows_saved' => $this->rowsSaved,
                            'rows_skipped' => $this->rowsSkipped,
                            'warnings' => $this->warnings,
                            'crop_year' => $this->importCropYear,
                            'composite_sugar_price' => $this->compositeSugarPrice,
                            'composite_molasses_price' => $this->compositeMolassesPrice,
                            'planters_created' => $this->plantersCreatedCount,
                            'haciendas_created' => $this->haciendasCreatedCount,
                            'total_net_cw' => round($this->totalNetCw, 3),
                            'total_actual_lkg' => round($this->totalActualLkg, 3),
                        ]);

                        $importJob->update([
                            'status' => ImportJob::STATUS_DONE,
                            'finished_at' => now(),
                            'context' => $context,
                            'message' => "Import complete. {$this->rowsSaved} production rows imported, {$this->rowsSkipped} rows skipped.",
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
            if (!is_string($source) || $source === '') {
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
