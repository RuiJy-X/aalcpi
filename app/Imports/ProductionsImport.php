<?php

namespace App\Imports;

use App\Models\Hacienda;
use App\Models\Planter;
use App\Models\Production;
use App\Services\FinancialDistributionService;
use Carbon\Carbon;
use Maatwebsite\Excel\Concerns\OnEachRow;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Row;

class ProductionsImport implements OnEachRow, WithHeadingRow
{
    public function __construct(
        private readonly FinancialDistributionService $distributionService,
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

        $productionDate = $this->normalizeProductionDate($row);
        $cropYear = $this->normalizeCropYear($row['crop_year'] ?? null, $productionDate);

        $production = Production::updateOrCreate(
            ['trans_code' => $row['trans_code']],
            [
                'planter_id' => $planter->id,
                'hacienda_id' => $hacienda->id,
                'planter_code' => $row['planter_code'],
                'hacienda_code' => $row['hacienda_code'] ?? $row['hacienda_code'],
                'production_date'        => $productionDate,
                'crop_year'              => $cropYear,
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

    private function normalizeProductionDate(array $row): ?string
    {
        $rawDate = $row['production_date'] ?? null;

        if (!empty($rawDate)) {
            return Carbon::parse((string) $rawDate)->toDateString();
        }

        $legacyDate = $this->buildProductionDate(
            $row['production_year'] ?? null,
            $row['production_month'] ?? null,
        );

        return $legacyDate ?: Carbon::now()->toDateString();
    }

    private function normalizeCropYear(mixed $cropYearValue, ?string $productionDate): ?string
    {
        if (is_string($cropYearValue) && preg_match('/^\d{4}-\d{4}$/', trim($cropYearValue))) {
            return trim($cropYearValue);
        }

        if (empty($productionDate)) {
            $startYear = (int) Carbon::now()->format('Y');
            return sprintf('%04d-%04d', $startYear, $startYear + 1);
        }

        $startYear = (int) Carbon::parse($productionDate)->format('Y');
        return sprintf('%04d-%04d', $startYear, $startYear + 1);
    }

    private function buildProductionDate(mixed $yearValue, mixed $monthValue): ?string
    {
        $year = (int) ($yearValue ?? 0);
        if ($year < 1900) {
            return null;
        }

        $month = $this->parseMonthValue($monthValue);
        if ($month === null) {
            return null;
        }

        return sprintf('%04d-%02d-01', $year, $month);
    }

    private function parseMonthValue(mixed $value): ?int
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (is_numeric($value)) {
            $month = (int) $value;
            return $month >= 1 && $month <= 12 ? $month : null;
        }

        $normalized = strtolower(trim((string) $value));
        $map = [
            'jan' => 1,
            'january' => 1,
            'feb' => 2,
            'february' => 2,
            'mar' => 3,
            'march' => 3,
            'apr' => 4,
            'april' => 4,
            'may' => 5,
            'jun' => 6,
            'june' => 6,
            'jul' => 7,
            'july' => 7,
            'aug' => 8,
            'august' => 8,
            'sep' => 9,
            'sept' => 9,
            'september' => 9,
            'oct' => 10,
            'october' => 10,
            'nov' => 11,
            'november' => 11,
            'dec' => 12,
            'december' => 12,
        ];

        return $map[$normalized] ?? null;
    }

}
