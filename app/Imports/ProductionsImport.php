<?php

namespace App\Imports;

use App\Models\Production;
use App\Models\Land;
use App\Models\Planter;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class ProductionsImport implements ToModel, WithHeadingRow
{
    /**
    * @param array $row
    *
    * @return \Illuminate\Database\Eloquent\Model|null
    */
    public function model(array $row)
    {
        $planter = Planter::firstOrCreate(
            ['planter_code' => $row['planter_code']], // Use the correct key for planter_code
            ['name' => $row['planter_name'] ?? 'Unknown Planter',
            'registration_date' => now()] // Optionally set a default name
        );

        $land = Land::firstOrCreate(
            ['land_code' => $row['hacienda_code'] ?? $row['land_code'],
            'planter_id' => $planter->id,], // Use the correct key for land_code
            [
                
                'name' => $row['hacienda_name'] ?? $row['land_name'] ?? 'Unknown Land', // Optionally set a default name
                'address' => $row['land_address'] ?? 'Unknown Address',
                'area_hectares' => $row['area_hectares'] ?? 0,
                'distance_from_urc' => $row['distance_from_urc'] ?? 0,
                'is_active' => true, // Default to active
            ]
        );
        
        return new Production([
            'planter_id' => $planter->id,
            'land_id' => $land->id,
            'planter_code' => $row['planter_code'],
            'land_code' => $row['hacienda_code'] ?? $row['land_code'],
            'production_year'        => $row['production_year'],
            'production_month'       => $row['production_month'],
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
            'trans_code'             => $row['trans_code'],
            'transloading'           => filter_var($row['transloading'], FILTER_VALIDATE_BOOLEAN),

        ]);
    }
}
