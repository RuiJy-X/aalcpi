<?php

namespace App\Imports;

use App\Models\Hacienda;
use App\Models\Planter;
use Illuminate\Database\Eloquent\Model;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithSkipDuplicates;
use Maatwebsite\Excel\Concerns\WithUpserts;

class PlanterImport implements ToModel, WithHeadingRow, WithSkipDuplicates, WithUpserts
{
    public function __construct(private readonly array $mapping = []) {}

    /**
     * @return Model|null
     */
    public function model(array $row)
    {
        $row = $this->applyMapping($row);

        // Pad codes to 5 digits with leading zeros
        $planterCode = $this->padCode($row['planter_code'] ?? $row['Pcode'] ?? '0');
        $haciendaCode = $this->padCode($row['hacienda_code'] ?? $row['land_code'] ?? $row['Hcode'] ?? '0');

        $planterName = $row['name'] ?? $row['planter_name'] ?? $row['Pname'] ?? 'Unknown Planter';
        $planterAddress = $row['address'] ?? 'Unknown Address';
        $contactNumber = $row['contact_number'] ?? null;
        $tinNumber = $row['tin_number'] ?? null;
        $regDate = $row['registration_date'] ?? now()->toDateString();

        $planter = Planter::updateOrCreate(
            ['planter_code' => $planterCode],
            array_filter([
                'name' => $planterName,
                'address' => $planterAddress,
                'contact_number' => $contactNumber,
                'tin_number' => $tinNumber,
                'registration_date' => $regDate,
            ], fn ($val) => ! is_null($val) && $val !== '')
        );

        $haciendaName = $row['hacienda_name'] ?? $row['land_name'] ?? 'Unknown Hacienda';
        $haciendaAddress = $row['hacienda_address'] ?? 'Unknown Address';
        $areaHectares = isset($row['area_hectares']) ? (float) $row['area_hectares'] : 0;
        $distanceFromUrc = isset($row['distance_from_urc']) ? (float) $row['distance_from_urc'] : 0;

        $hacienda = Hacienda::updateOrCreate(
            ['hacienda_code' => $haciendaCode],
            [
                'planter_id' => $planter->id,
                'name' => $haciendaName,
                'address' => $haciendaAddress,
                'area_hectares' => $areaHectares,
                'distance_from_urc' => $distanceFromUrc,
                'is_active' => true,
            ]
        );

        return $planter;
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

        // Convert to string, trim whitespace, and pad with leading zeros to 5 digits
        return str_pad((string) trim((string) $code), 5, '0', STR_PAD_LEFT);
    }
}
