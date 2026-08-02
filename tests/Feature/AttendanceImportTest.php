<?php

use App\Imports\AttendanceImport;
use App\Models\Attendance;
use App\Models\Employee;

it('imports dtr rows for the resolved employee', function () {
    $employee = Employee::factory()->create([
        'employee_code' => 'EMP-100',
        'name' => 'Juan Dela Cruz',
    ]);

    $import = new AttendanceImport(persist: true);
    $import->employee = $employee;
    $import->employeeCode = $employee->employee_code;
    $import->employeeName = $employee->name;

    $import->collection(collect([
        [
            '2026-04-02',
            'Thursday',
            '07:50:00 - 16:10:00',
            null,
            null,
            null,
            null,
            2,
            null,
            8.33,
        ],
        [
            '2026-04-03',
            'Friday',
            '08:00:00 - 17:00:00',
            null,
            null,
            null,
            null,
            2,
            null,
            8,
        ],
    ]));

    expect($import->importedCount)->toBe(2);
    expect(Attendance::query()->count())->toBe(2);

    $this->assertDatabaseHas('attendances', [
        'employee_id' => $employee->id,
        'date' => '2026-04-02',
        'time_in' => '07:50:00',
        'time_out' => '16:10:00',
        'times' => 2,
    ]);

    $this->assertDatabaseHas('attendances', [
        'employee_id' => $employee->id,
        'date' => '2026-04-03',
        'time_in' => '08:00:00',
        'time_out' => '17:00:00',
        'times' => 2,
    ]);
});
