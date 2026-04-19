<?php

namespace App\Imports;

use App\Models\Planter;
use App\Models\RawData;
use Carbon\Carbon;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithValidation;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithSkipDuplicates;
use Maatwebsite\Excel\Concerns\WithUpserts;

class RawDataImport implements ToModel, WithHeadingRow, WithSkipDuplicates, WithUpserts, WithValidation
{
    private function normalizeDate(mixed $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (is_numeric($value)) {
            return Carbon::instance(ExcelDate::excelToDateTimeObject((float) $value))->toDateString();
        }

        return Carbon::parse((string) $value)->toDateString();
    }

    private function normalizePlanterCode(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $code = strtoupper(trim((string) $value));

        return $code === '' ? null : $code;
    }

    public function prepareForValidation($data, $index): array
    {
        $data['planter_code'] = $this->normalizePlanterCode($data['planter_code'] ?? null);

        return $data;
    }

    private function resolvePlanterCode(array $row): ?string
    {
        $planterCode = $this->normalizePlanterCode($row['planter_code'] ?? null);

        if ($planterCode === null) {
            return null;
        }

        Planter::firstOrCreate(
            ['planter_code' => $planterCode],
            [
                'name' => 'Auto Imported ' . $planterCode,
                'registration_date' => Carbon::now()->toDateString(),
            ]
        );

        return $planterCode;
    }

    public function model(array $row)
    {
        return new RawData([
            'crop_year' => $row['crop_year'] ?? null,
            'date' => $this->normalizeDate($row['date'] ?? null),
            'planter_code' => $this->resolvePlanterCode($row),
            'gross_cw' => $row['gross_cw'] ?? null,
            'net_cw' => $row['net_cw'] ?? null,
            'trucks' => $row['trucks'] ?? null,
            'theoretical_lkg' => $row['theoretical_lkg'] ?? null,
            'actual_lkg' => $row['actual_lkg'] ?? null,
            'calculated_sugar' => $row['calculated_sugar'] ?? null,
            'trash' => $row['trash'] ?? null,
            'Lkg_per_TC' => $row['lkg_per_tc'] ?? null,
        ]);
    }

    public function uniqueBy(): array
    {
        return ['crop_year', 'date', 'planter_code'];
    }

    public function rules(): array
    {
        return [
            'planter_code' => ['required', 'string', 'max:255'],
        ];
    }
}
