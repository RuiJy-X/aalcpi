<?php

namespace App\Imports;

use App\Models\Attendance;
use App\Models\Employee;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithStartRow;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Events\BeforeImport;

/**
 * Columns (0-indexed), starting at row 7:
 *   A (0) – Date
 *   C (2) – Time range  (e.g. "7:57:39 - 16:25:57")
 *   H (7) – Punch count
 *   J (9) – Working hours
 */
class AttendanceImport implements ToCollection, WithStartRow, SkipsEmptyRows, WithEvents
{
    const COL_DATE        = 0;
    const COL_TIME_RANGE  = 2;
    const COL_PUNCH_COUNT = 7;
    const COL_WORKING_HRS = 9;

    public int $importedCount = 0;
    public int $totalDays = 0;
    public float $totalHours = 0.0;
    public string $employeeCode = '';
    public string $employeeName = '';
    public ?CarbonImmutable $periodStart = null;
    public ?CarbonImmutable $periodEnd = null;

    /** @var array<int, array{date: string, time_in: string|null, time_out: string|null, working_time: float}> */
    public array $attendanceRows = [];

    public ?Employee $employee = null;

    public function __construct(
        private readonly bool $persist = true,
        private readonly ?array $employeeData = null,
    ) {
    }
    public function registerEvents(): array
    {
        return [
            BeforeImport::class => function (BeforeImport $event) {
                $sheet = $event->reader->getActiveSheet();
                $employeeCode = (string) ($sheet->rangeToArray('A6:J6')[0][0] ?? '');
                $name = (string) ($sheet->rangeToArray('A6:J6')[0][1] ?? '');
                $dateRange = (string) ($sheet->rangeToArray('A2:J2')[0][5] ?? '');

                $this->employeeCode = trim($employeeCode);
                $this->employeeName = trim($name);

                [$periodStart, $periodEnd] = $this->parseDateRange($dateRange);
                $this->periodStart = $periodStart;
                $this->periodEnd = $periodEnd;

                if ($this->persist) {
                    $employeeData = $this->employeeData ?? [];

                    $payload = array_filter([
                        'name' => $employeeData['name'] ?? $this->employeeName,
                        'department' => $employeeData['department'] ?? null,
                        'position' => $employeeData['position'] ?? null,
                        'employment_type' => $employeeData['employment_type'] ?? null,
                        'hourly_rate' => $employeeData['hourly_rate'] ?? null,
                        'base_salary' => $employeeData['base_salary'] ?? null,
                    ], static fn ($value) => $value !== null && $value !== '');

                    $employee = Employee::updateOrCreate([
                        'employee_code' => $this->employeeCode,
                    ], $payload);

                    $this->employee = $employee;
                } else {
                    $this->employee = Employee::query()
                        ->where('employee_code', $this->employeeCode)
                        ->first();
                }
            },
        ];
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

            $workingTime = isset($row[self::COL_WORKING_HRS]) ? (float) $row[self::COL_WORKING_HRS] : 0.00;

            $this->attendanceRows[] = [
                'date' => $date->toDateString(),
                'time_in' => $timeIn,
                'time_out' => $timeOut,
                'working_time' => $workingTime,
            ];

            $this->totalDays += 1;
            $this->totalHours += $workingTime;

            if ($this->persist && $this->employee) {
                Attendance::updateOrCreate([
                    'employee_id' => $this->employee->id,
                    'date' => $date->toDateString(),
                ], [
                    'week' => $date->format('W'),
                    'time_in' => $timeIn,
                    'time_out' => $timeOut,
                    'times' => isset($row[self::COL_PUNCH_COUNT]) ? (int) $row[self::COL_PUNCH_COUNT] : null,
                    'working_time' => $workingTime,
                ]);
            }

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
     * @return array{0: CarbonImmutable|null, 1: CarbonImmutable|null}
     */
    private function parseDateRange(string $dateRange): array
    {
        if (trim($dateRange) === '') {
            return [null, null];
        }

        $parts = array_map('trim', explode('to', $dateRange, 2));

        if (count($parts) < 2) {
            return [null, null];
        }

        try {
            return [
                CarbonImmutable::parse($parts[0]),
                CarbonImmutable::parse($parts[1]),
            ];
        } catch (\Exception $e) {
            return [null, null];
        }
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
