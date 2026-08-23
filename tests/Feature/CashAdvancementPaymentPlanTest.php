<?php

namespace Tests\Feature;

use App\Models\Advancement;
use App\Models\Employee;
use App\Models\Payroll;
use App\Models\User;
use App\Services\PayrollAuditService;
use App\Support\Permissions;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CashAdvancementPaymentPlanTest extends TestCase
{
    use RefreshDatabase;

    public function test_granting_cash_advancement_with_5_months_payment_plan_calculates_correct_installment(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole(Permissions::SUPER_ADMIN_ROLE);

        $employee = Employee::factory()->create([
            'name' => 'Test Employee',
            'daily_rate' => 600.00,
        ]);

        // 1. Grant 5,000 advancement with 5 Months payment plan (5 months = 10 semi-monthly cutoffs @ 500.00/cutoff)
        $response = $this->actingAs($admin)->post('/advancements', [
            'employee_id' => $employee->id,
            'amount' => 5000.00,
            'advancement_date' => '2026-08-01',
            'repayment_term_type' => 'months',
            'repayment_terms' => 5,
            'notes' => 'Medical loan 5000 over 5 months',
        ]);

        $response->assertSessionHasNoErrors();

        $adv = Advancement::where('employee_id', $employee->id)->first();
        $this->assertNotNull($adv);
        $this->assertEquals(5000.00, (float) $adv->amount);
        $this->assertEquals('months', $adv->repayment_term_type);
        $this->assertEquals(5, $adv->repayment_terms);
        $this->assertEquals(500.00, (float) $adv->installment_amount);

        // 2. Mark payout as paid out (simulate payroll payout)
        $adv->update(['status' => 'paid_out']);

        // 3. Test Payroll Audit Service for next cutoff
        $auditService = app(PayrollAuditService::class);
        $periodStart = Carbon::parse('2026-08-16');
        $periodEnd = Carbon::parse('2026-08-31');

        $audit = $auditService->auditBatch($periodStart, $periodEnd);
        $empAudit = collect($audit['ready'])->firstWhere('employee_id', $employee->id);

        $this->assertNotNull($empAudit);
        // Expect exact 500.00 deduction cap instead of 5,000.00 full amount
        $this->assertEquals(500.00, (float) $empAudit['cash_advance_deduction']);

        // 4. Generate draft payroll & mark as paid
        $payroll = Payroll::create([
            'employee_id' => $employee->id,
            'period_start' => $periodStart->toDateString(),
            'period_end' => $periodEnd->toDateString(),
            'payroll_date' => $periodEnd->toDateString(),
            'days_worked' => 10,
            'total_days' => 10,
            'total_hours' => 80,
            'hours_worked' => 80,
            'hourly_rate' => 75.00,
            'basic_pay' => 6000.00,
            'gross_pay' => 6000.00,
            'cash_advance_payout' => 0.00,
            'cash_advance_deduction' => 500.00,
            'deductions' => 500.00,
            'net_pay' => 5500.00,
            'status' => 'draft',
        ]);

        $statusResponse = $this->actingAs($admin)
            ->patch(route('payroll.update-status', $payroll->id), [
                'status' => 'paid',
            ]);

        $statusResponse->assertSessionHasNoErrors();

        // 5. Verify advancement balance updated to 4,500.00 & status partially_deducted
        $adv->refresh();
        $this->assertEquals(4500.00, (float) $adv->remaining_balance);
        $this->assertEquals('partially_deducted', $adv->status);

        $this->assertDatabaseHas('advancement_deductions', [
            'advancement_id' => $adv->id,
            'payroll_id' => $payroll->id,
            'amount_deducted' => 500.00,
        ]);
    }

    public function test_granting_cash_advancement_with_fixed_amount_plan(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole(Permissions::SUPER_ADMIN_ROLE);

        $employee = Employee::factory()->create([
            'name' => 'Fixed Plan Employee',
            'daily_rate' => 500.00,
        ]);

        $response = $this->actingAs($admin)->post('/advancements', [
            'employee_id' => $employee->id,
            'amount' => 3000.00,
            'advancement_date' => '2026-08-01',
            'repayment_term_type' => 'fixed_amount',
            'installment_amount' => 750.00,
        ]);

        $response->assertSessionHasNoErrors();

        $adv = Advancement::where('employee_id', $employee->id)->first();
        $this->assertNotNull($adv);
        $this->assertEquals(3000.00, (float) $adv->amount);
        $this->assertEquals('fixed_amount', $adv->repayment_term_type);
        $this->assertEquals(750.00, (float) $adv->installment_amount);
    }
}
