<?php

namespace App\Imports;

use App\Models\Attendance;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithStartRow;

/**
 * Columns (0-indexed), starting at row 7:
 *   A (0) – Date
 *   C (2) – Time range  (e.g. "7:57:39 - 16:25:57")
 *   H (7) – Punch count
 *   J (9) – Working hours
 */
class AttendanceImport implements ToCollection, WithStartRow, SkipsEmptyRows
{
    const COL_DATE        = 0;
    const COL_TIME_RANGE  = 2;
    const COL_PUNCH_COUNT = 7;
    const COL_WORKING_HRS = 9;

    public int $importedCount = 0;
    public function __construct(
        private readonly int $employeeId,
    ) {
    }

    public function startRow(): int
    {
        return 7;
    }

    public function collection(Collection $rows): void
    {
        foreach ($rows as $row) {
            if (empty($row[self::COL_DATE])) {
                continue;
            }

            $date = $this->parseDate($row[self::COL_DATE]);


            $timeRange = trim((string) ($row[self::COL_TIME_RANGE] ?? ''));
            [$timeIn, $timeOut] = $this->parseTimeRange($timeRange);

            Attendance::updateOrCreate([
                'employee_id' => $this->employeeId,
                'date' => $date->toDateString(),
            ], [
                'week' => $date->format('W'),
                'time_in' => $timeIn,
                'time_out' => $timeOut,
                'times' => isset($row[self::COL_PUNCH_COUNT]) ? (int) $row[self::COL_PUNCH_COUNT] : null,
                'working_time' => isset($row[self::COL_WORKING_HRS]) ? (float) $row[self::COL_WORKING_HRS] : 0.00,
            ]);

            $this->importedCount++;
        }
    }

    private function parseDate(mixed $value): CarbonImmutable
    {
        if ($value instanceof \DateTimeInterface) {
            return CarbonImmutable::instance($value);
        }

        if (is_numeric($value)) {
            return CarbonImmutable::instance(
                \PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject($value),
            );
        }

        return CarbonImmutable::parse((string) $value);
    }

    /**
     * @return array{string|null, string|null}
     */
    private function parseTimeRange(string $timeRange): array
    {
        if (empty($timeRange)) {
            return [null, null];
        }

        $parts = array_map('trim', explode('-', $timeRange, 2));

        return [$parts[0] ?? null, $parts[1] ?? null];
    }
}
