<?php

use App\Models\Attendance;
use App\Models\Employee;
use App\Models\Payroll;
use App\Models\User;
use App\Services\PayrollAuditService;
use App\Support\Permissions;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Support\Carbon;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
    $this->admin = User::factory()->create();
    $this->admin->assignRole(Permissions::SUPER_ADMIN_ROLE);
});

test('payroll batch audit reads employee sss_contribution deduction correctly', function () {
    $employee = Employee::factory()->create([
        'daily_rate' => 500.00,
        'sss_contribution' => 200.00,
        'pagibig_contribution' => 100.00,
        'philhealth_contribution' => 50.00,
    ]);

    Attendance::create([
        'employee_id' => $employee->id,
        'date' => '2026-08-01',
        'time_in' => '08:00:00',
        'time_out' => '17:00:00',
        'working_time' => 8.00,
    ]);

    $auditService = new PayrollAuditService;
    $start = Carbon::parse('2026-08-01');
    $end = Carbon::parse('2026-08-15');

    $batchData = $auditService->auditBatch($start, $end);

    expect($batchData['ready'])->not->toBeEmpty();
    $auditedEmp = $batchData['ready'][0];

    expect((float) $auditedEmp['sss_contribution'])->toBe(200.00);
    expect((float) $auditedEmp['sss_loan'])->toBe(200.00);
    expect((float) $auditedEmp['total_deductions'])->toBe(350.00); // 200 SSS + 100 Pag-IBIG + 50 PhilHealth
    expect((float) $auditedEmp['basic_pay'])->toBe(500.00);
    expect((float) $auditedEmp['net_amount'])->toBe(150.00); // 500 - 350
});

test('processBatch persists sss_contribution into sss_loan payroll database record', function () {
    $employee = Employee::factory()->create([
        'daily_rate' => 600.00,
        'sss_contribution' => 200.00,
    ]);

    Attendance::create([
        'employee_id' => $employee->id,
        'date' => '2026-08-01',
        'time_in' => '08:00:00',
        'time_out' => '17:00:00',
        'working_time' => 8.00,
    ]);

    $response = $this->actingAs($this->admin)->postJson('/Payroll/process-batch', [
        'period_start' => '2026-08-01',
        'period_end' => '2026-08-15',
        'employee_ids' => [$employee->id],
    ]);

    $response->assertStatus(200);

    $payroll = Payroll::where('employee_id', $employee->id)->first();
    expect($payroll)->not->toBeNull();
    expect((float) $payroll->sss_loan)->toBe(200.00);
});
