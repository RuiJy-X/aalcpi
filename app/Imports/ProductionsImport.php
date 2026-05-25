<?php
namespace App\Imports;


use App\Models\Hacienda;
use App\Models\Planter;
use App\Models\Production;
use Illuminate\Contracts\Queue\ShouldQueue;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithChunkReading;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class ProductionsImport implements ToModel, WithHeadingRow, ShouldQueue, WithChunkReading
{
    public function __construct(
        private readonly string $importCropYear,
        private readonly array $mapping = [],
        private readonly float | null $compositeSugarPrice = null,
        private readonly float | null $compositeMolassesPrice = null,
    ) {}

    public function model(array $row)
    {
        $row = $this->applyMapping($row);

        // 1. SKIP EMPTY ROWS (Critical to avoid the Not Null Violation)
        if (empty($row['planter_code']) && empty($row['Pcode'])) {
            return null;
        }

        $sanitizeNum = function($val) {
        if (empty($val)) return 0;

        // Remove commas (e.g., "32,871" becomes "32871")
        // If the comma was intended as a decimal, use: str_replace(',', '.', $val)
        $cleanVal = str_replace(',', '', $val);

        return is_numeric($cleanVal) ? (float) $cleanVal : 0;
        };

        // 2. HELPER for numeric values
        $toNum = fn($val) => is_numeric($val) ? $val : 0;
        $toBool = fn($val) => filter_var($val, FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE) ?? false;
        $toNullablePrice = fn($val) => ($val === null || $val === '')
            ? null
            : (is_numeric($val) ? (float) $val : null);

        // 3. PAD CODES to 5 digits with leading zeros
        $planterCode = $this->padCode($row['planter_code'] ?? $row['Pcode'] ?? '0');
        $haciendaCode = $this->padCode($row['hacienda_code'] ?? $row['Hcode'] ?? '0');

        // 4. PLANTER
        $planter = Planter::updateOrCreate(
            ['planter_code' => $planterCode],
            [
                'name' => $row['planter_name'] ?? $row['Pname'] ?? $row['Planter Name'] ?? 'Unknown Planter',
                'registration_date' => now(),
            ]
        );

        // 5. HACIENDA
        $hacienda = Hacienda::updateOrCreate(
            ['hacienda_code' => $haciendaCode],
            [
                'planter_id' => $planter->id,
                'name' => $row['hacienda_name'] ?? $row['Hacienda Name'] ?? 'Unknown Hacienda',
                'is_active' => true,
            ]
        );

        // 6. PRODUCTION (Mapping to your specific Excel headers)
        // Note the "re_" prefix based on your screenshot!
        return Production::updateOrCreate(
            [
                'planter_code'  => $planterCode,
                'hacienda_code' => $haciendaCode,
                'crop_year'     => $this->importCropYear,
                ],
                [
                'trucks' => $toNum($row['trucks'] ?? 0),
                'trans_code'    => $row['trans_code'] ?? '0',
                'planter_id'           => $planter->id,
                'hacienda_id'          => $hacienda->id,
                'gross_cw'             => $toNum($row['gross_cw'] ?? 0),
                'net_cw'               => $toNum($row['net_cw'] ?? $row['Tonnes Net'] ?? 0),
                'pdpa_lkg' => $toNum($row['pdpa_lkg'] ?? 0),
                'actual_lkg'           => $toNum($row['actual_lkg'] ?? $row['Total Sugar'] ?? 0),
                'theoretical_lkg'      => $toNum($row['theoretical_lkg'] ?? $row['theo_lkg'] ?? 0),
                'pshr_net_lkg'         => $toNum($row['pshr_net_lkg'] ?? $row['pshr_net_sugar'] ?? $row['planter_share_sugar'] ?? $row['Sugar (64%)'] ?? 0),
                'actual_mol'           => $toNum($row['re actual_mol'] ?? $row['actual_mol'] ?? $row['Total Mol'] ?? 0), // Note the 're_'
                'pshr_net_mol'         => $toNum($row['re pshr_net_mol'] ?? $row['pshr_net_mol'] ?? $row['Pshr_Net_Mol'] ?? $row['Mol (64%)'] ?? 0), // Note the 're_'
                'pdpa_mol' => $toNum($row['re_pdpa_mol'] ?? $row['pdpa_mol'] ?? 0),

                'association_dues_lkg' => $toNum($row['assn_dues_lkg'] ?? $row['assn_dues_sugar'] ?? 0),
                'association_dues_mol' => $toNum($row['Assn_Dues_Mol'] ?? $row['assn_dues_mol'] ?? $row['re assn_dues_mol'] ?? 0),
                'composite_sugar_price' => $toNullablePrice($this->compositeSugarPrice),
                'composite_molasses_price' => $toNullablePrice($this->compositeMolassesPrice),
                'transloading'         => $toBool($row['transloading'] ?? false),
            ]
        );
    }
    public function chunkSize(): int
    {
        return 1000;
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
        // Convert to string, trim whitespace, and pad with leading zeros to 5 digits
        return str_pad((string) trim((string) $code), 5, '0', STR_PAD_LEFT);
    }
}
