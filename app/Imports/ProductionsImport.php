<?php

namespace App\Imports;

use App\Models\Hacienda;
use App\Models\Planter;
use App\Models\Production;
use App\Services\FinancialDistributionService;
use Maatwebsite\Excel\Concerns\OnEachRow;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Row;

class ProductionsImport implements OnEachRow, WithHeadingRow
{
    public function __construct(
        private readonly FinancialDistributionService $distributionService,
        private readonly string $importCropYear,
    ) {
    }

    /**
    * @param Row $row
    *
    * @return void
    */
    public function onRow(Row $row): void
    {
        $row = $row->toArray();

        $planter = Planter::firstOrCreate(
            ['planter_code' => $row['planter_code']], // Use the correct key for planter_code
            ['name' => $row['planter_name'] ?? 'Unknown Planter',
            'registration_date' => now()] // Optionally set a default name
        );

        $hacienda = Hacienda::firstOrCreate(
            ['hacienda_code' => $row['hacienda_code'] ?? $row['hacienda_code'],
            'planter_id' => $planter->id,], // Use the correct key for hacienda_code
            [

                'name' => $row['hacienda_name'] ?? $row['hacienda_name'] ?? 'Unknown Hacienda', // Optionally set a default name
                'address' => $row['hacienda_address'] ?? $row['address'] ?? 'Unknown Address',
                'area_hectares' => $row['area_hectares'] ?? 0,
                'distance_from_urc' => $row['distance_from_urc'] ?? 0,
                'is_active' => true, // Default to active
            ]
        );

        $productionDate = $this->defaultProductionDateFromCropYear($this->importCropYear);

        $production = Production::updateOrCreate(
            ['trans_code' => $row['trans_code']],
            [
                'planter_id' => $planter->id,
                'hacienda_id' => $hacienda->id,
                'planter_code' => $row['planter_code'],
                'hacienda_code' => $row['hacienda_code'] ?? $row['hacienda_code'],
                'production_date'        => $productionDate,
                'crop_year'              => $this->importCropYear,
                'gross_cw'               => $row['gross_cw'],
                'net_cw'                 => $row['net_cw'],
                'trucks'                 => $row['trucks'],
                'theoretical_lkg'        => $row['theoretical_lkg'],
                'actual_lkg'             => $row['actual_lkg'],
                'pshr_net_lkg'           => $row['pshr_net_lkg'],
                'pdpa_lkg'               => $row['pdpa_lkg'],
                'association_dues_lkg'   => $row['association_dues_lkg'],
                'actual_mol'             => $row['actual_mol'],
                'pshr_net_mol'           => $row['pshr_net_mol'],
                'pdpa_mol'               => $row['pdpa_mol'],
                'association_dues_mol'   => $row['association_dues_mol'],
                'transloading'           => filter_var($row['transloading'] ?? false, FILTER_VALIDATE_BOOLEAN),
            ]
        );

        $this->distributionService->syncAndCalculateForProduction($production);
    }

    private function defaultProductionDateFromCropYear(string $cropYear): string
    {
        $startYear = (int) substr($cropYear, 0, 4);

        if ($startYear < 1900) {
            return '2000-01-01';
        }

        return sprintf('%04d-01-01', $startYear);
    }

}
