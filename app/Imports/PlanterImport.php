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
    public function __construct(private readonly array $mapping = []) {}

    /**
    * @param array $row
    *
    * @return \Illuminate\Database\Eloquent\Model|null
    */
    public function model(array $row)
    {
        $row = $this->applyMapping($row);

        // Pad codes to 5 digits with leading zeros
        $planterCode = $this->padCode($row['planter_code'] ?? '0');
        $haciendaCode = $this->padCode($row['land_code'] ?? $row['hacienda_code'] ?? '0');

        $planter = Planter::firstOrCreate(
            ['planter_code'=> $planterCode],
            [
                'name' => $row['name'] ?? $row['planter_name'] ?? 'Unknown Planter',
                'address' => $row['address'] ?? 'Unknown Address',
                'contact_number' => $row['contact_number'] ?? null,
                'tin_number' => $row['tin_number'] ?? null,
                'registration_date' => $row['registration_date'] ?? now()->toDateString(),
            ]
        );

        $hacienda = Hacienda::firstOrCreate(
            ['hacienda_code' => $haciendaCode],
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
            'planter_code' => $planterCode,
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
