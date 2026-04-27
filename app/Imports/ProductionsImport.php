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
    public function __construct(private readonly string $importCropYear) {}

    public function model(array $row)
    {
        // 1. SKIP EMPTY ROWS (Critical to avoid the Not Null Violation)
        if (empty($row['planter_code'])) {
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

        // 3. PLANTER
        $planter = Planter::updateOrCreate(
            ['planter_code' => $row['planter_code']],
            ['name' => $row['planter_name'] ?? 'Unknown Planter', 'registration_date' => now()]
        );

        // 4. HACIENDA
        $hacienda = Hacienda::updateOrCreate(
            ['hacienda_code' => $row['hacienda_code']],
            [
                'planter_id' => $planter->id,
                'name' => $row['hacienda_name'] ?? 'Unknown Hacienda',
                'is_active' => true,
            ]
        );

        // 5. PRODUCTION (Mapping to your specific Excel headers)
        // Note the "re_" prefix based on your screenshot!
        return Production::updateOrCreate(
            [
                'planter_code'  => $row['planter_code'],
                'hacienda_code' => $row['hacienda_code'],
                'crop_year'     => $this->importCropYear,
                ],
                [
                'trucks' => $row['trucks'] ?? 0,
                'trans_code'    => $row['trans_code'] ?? null, // Ensure this column exists in Excel!
                'planter_id'           => $planter->id,
                'hacienda_id'          => $hacienda->id,
                'gross_cw'             => $toNum($row['gross_cw'] ?? 0),
                'net_cw'               => $toNum($row['net_cw'] ?? 0),
                'pdpa_lkg' => $toNum($row['pdpa_lkg'] ?? 0),
                'actual_lkg'           => $toNum($row['actual_lkg'] ?? 0),
                'theoretical_lkg'      => $toNum($row['theoretical_lkg'] ?? $row['theo_lkg'] ?? 0),
                'pshr_net_lkg'         => $toNum($row['pshr_net_lkg'] ?? $row['pshr_net_sugar'] ?? $row['planter_share_sugar'] ?? $row['Sugar (64%)'] ?? 0),
                'actual_mol'           => $toNum($row['re actual_mol'] ?? $row['actual_mol'] ?? 0), // Note the 're_'
                'pshr_net_mol'         => $toNum($row['re pshr_net_mol'] ?? $row['pshr_net_mol'] ?? $row['Pshr_Net_Mol'] ?? 0), // Note the 're_'
                'pdpa_mol' => $toNum($row['re_pdpa_mol'] ?? $row['pdpa_mol'] ?? 0),

                'association_dues_lkg' => $row['assn_dues_lkg'] ?? $row['assn_dues_sugar'] ?? 0,
                'association_dues_mol' => $row['Assn_Dues_Mol'] ?? $row['assn_dues_mol'] ?? $row['re assn_dues_mol'] ?? 0,
                'transloading'         => 0,
            ]
        );
    }
    public function chunkSize(): int
    {
        return 1000;
    }
}
