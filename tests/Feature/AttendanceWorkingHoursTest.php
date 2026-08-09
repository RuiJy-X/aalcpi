<?php

namespace Tests\Feature;

use App\Models\Attendance;
use App\Models\Employee;
use App\Services\PayrollAuditService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AttendanceWorkingHoursTest extends TestCase
{
    use RefreshDatabase;

    public function test_zero_or_null_working_hours_are_not_defaulted_to_eight_hours(): void
    {
        $employee = Employee::factory()->create([
            'daily_rate' => 800.00,
        ]);

        $periodStart = Carbon::parse('2026-08-01');
        $periodEnd = Carbon::parse('2026-08-15');

        // Day 1: Full day (8 hours)
        Attendance::create([
            'employee_id' => $employee->id,
            'date' => '2026-08-01',
            'working_time' => 8.00,
        ]);

        // Day 2: Zero working hours (absent entry / 0.00 hours)
        Attendance::create([
            'employee_id' => $employee->id,
            'date' => '2026-08-02',
            'working_time' => 0.00,
        ]);

        // Day 3: Partial shift (4 hours)
        Attendance::create([
            'employee_id' => $employee->id,
            'date' => '2026-08-03',
            'working_time' => 4.00,
        ]);

        $auditService = new PayrollAuditService();
        $batchData = $auditService->auditBatch($periodStart, $periodEnd);

        $employeeAudit = collect($batchData['ready'])->firstWhere('employee_id', $employee->id);

        $this->assertNotNull($employeeAudit);
        // Only days with working_time > 0 (Day 1 & Day 3) count as worked days
        $this->assertEquals(2, $employeeAudit['days_worked']);
        // Total hours = 8 + 0 + 4 = 12 hours
        $this->assertEquals(12.00, $employeeAudit['hours_worked']);
        // Basic pay = 2 days * 800.00 = 1,600.00 (NOT 2,400.00)
        $this->assertEquals(1600.00, $employeeAudit['basic_pay']);
    }
}
