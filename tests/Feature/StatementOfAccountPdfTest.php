<?php

namespace Tests\Feature;

use App\Models\Advancement;
use App\Models\Employee;
use App\Models\Payroll;
use App\Models\User;
use App\Support\Permissions;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StatementOfAccountPdfTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_generate_payroll_statement_of_account_pdf(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole(Permissions::SUPER_ADMIN_ROLE);

        $employee = Employee::factory()->create([
            'name' => 'Juan Dela Cruz',
            'daily_rate' => 500.00,
        ]);

        $payroll = Payroll::create([
            'employee_id' => $employee->id,
            'period_start' => '2026-08-01',
            'period_end' => '2026-08-15',
            'payroll_date' => '2026-08-15',
            'days_worked' => 10,
            'total_days' => 10,
            'total_hours' => 80,
            'hours_worked' => 80,
            'hourly_rate' => 62.50,
            'basic_pay' => 5000.00,
            'gross_pay' => 5000.00,
            'cash_advance_payout' => 0.00,
            'cash_advance_deduction' => 500.00,
            'deductions' => 800.00,
            'net_pay' => 4200.00,
            'status' => 'paid',
        ]);

        $response = $this->actingAs($admin)->get("/Payroll/{$payroll->id}/statement-of-account-pdf");

        $response->assertStatus(200);
        $response->assertHeader('content-type', 'application/pdf');
    }

    public function test_can_generate_employee_statement_of_account_pdf(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole(Permissions::SUPER_ADMIN_ROLE);

        $employee = Employee::factory()->create([
            'name' => 'Maria Santos',
            'daily_rate' => 600.00,
        ]);

        $response = $this->actingAs($admin)->get("/Employees/{$employee->id}/statement-of-account-pdf");

        $response->assertStatus(200);
        $response->assertHeader('content-type', 'application/pdf');
    }

    public function test_statement_of_account_pdf_only_includes_active_advancements(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole(Permissions::SUPER_ADMIN_ROLE);

        $employee = Employee::factory()->create([
            'name' => 'Pedro Penduko',
            'daily_rate' => 500.00,
        ]);

        // Active advancement
        Advancement::create([
            'employee_id' => $employee->id,
            'amount' => 3000.00,
            'remaining_balance' => 1500.00,
            'advancement_date' => '2026-08-01',
            'status' => 'partially_deducted',
        ]);

        // Historical / cancelled advancements (should be excluded)
        Advancement::create([
            'employee_id' => $employee->id,
            'amount' => 2000.00,
            'remaining_balance' => 0.00,
            'advancement_date' => '2026-01-01',
            'status' => 'deducted',
        ]);

        Advancement::create([
            'employee_id' => $employee->id,
            'amount' => 1000.00,
            'remaining_balance' => 1000.00,
            'advancement_date' => '2026-02-01',
            'status' => 'cancelled',
        ]);

        $response = $this->actingAs($admin)->get("/Employees/{$employee->id}/statement-of-account-pdf");

        $response->assertStatus(200);
        $response->assertHeader('content-type', 'application/pdf');
    }
}
