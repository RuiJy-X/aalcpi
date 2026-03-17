<?php

namespace App\Imports;

use App\Models\Planter;
use App\Models\Hacienda;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithUpserts;
use Maatwebsite\Excel\Concerns\WithSkipDuplicates;

class PlanterImport implements ToModel, WithHeadingRow, WithSkipDuplicates, WithUpserts
{
    /**
    * @param array $row
    *
    * @return \Illuminate\Database\Eloquent\Model|null
    */
    public function model(array $row)
    {
        $planter = Planter::firstOrCreate(
            ['planter_code'=> $row['planter_code']],
            [
                'name' => $row['name'] ?? $row['planter_name'] ?? 'Unknown Planter',
                'address' => $row['address'] ?? 'Unknown Address',
                'contact_number' => $row['contact_number'] ?? null,
                'tin_number' => $row['tin_number'] ?? null,
                'registration_date' => $row['registration_date'] ?? now()->toDateString(),
            ]
        );

        $hacienda = Hacienda::firstOrCreate(
            ['hacienda_code' => $row['land_code'] ?? $row['hacienda_code']],
            [
                'planter_id' => $planter->id,
                'name' => $row['hacienda_name'] ?? $row['land_name'] ?? 'Unknown Hacienda',
                'address' => $row['hacienda_address'] ?? 'Unknown Address',
                'area_hectares' => $row['area_hectares'] ?? 0,
                'distance_from_urc' => $row['distance_from_urc'] ?? 0,
                'is_active' => true, // Default to active
            ]
        );
        return new Planter([
            'planter_id' => $planter->id,
            'planter_code' => $row['planter_code'],
            'name' => $row['name'] ?? $row['planter_name'] ?? 'Unknown Planter',
            'address' => $row['address'] ?? 'Unknown Address',
            'contact_number' => $row['contact_number'] ?? null,
            'tin_number' => $row['tin_number'] ?? null,
            'registration_date' => $row['registration_date'] ?? now()->toDateString(),
            'haciendas' => $hacienda, // Associate the hacienda with the planter
        ]);
    }
    public function uniqueBy()
    {
        return 'planter_code';
    }
}
