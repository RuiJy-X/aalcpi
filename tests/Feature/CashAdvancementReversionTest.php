<?php

namespace Tests\Feature;

use App\Models\Advancement;
use App\Models\AdvancementDeduction;
use App\Models\Employee;
use App\Models\Payroll;
use App\Models\User;
use App\Support\Permissions;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CashAdvancementReversionTest extends TestCase
{
    use RefreshDatabase;

    public function test_reverting_paid_payroll_to_draft_restores_exact_deductions_without_phantom_debt(): void
    {
        // 1. Create User & Employee
        $admin = User::factory()->create();
        $admin->assignRole(Permissions::SUPER_ADMIN_ROLE);

        $employee = Employee::factory()->create([
            'name' => 'Juan Dela Cruz',
            'daily_rate' => 500.00,
        ]);

        // 2. Create 2 Advancements with specific pre-existing balances
        // Advancement #1: Original 3,000.00, remaining balance 1,000.00
        $adv1 = Advancement::create([
            'employee_id' => $employee->id,
            'amount' => 3000.00,
            'remaining_balance' => 1000.00,
            'advancement_date' => now()->toDateString(),
            'status' => 'paid_out',
        ]);

        // Advancement #2: Original 2,000.00, remaining balance 2,000.00
        $adv2 = Advancement::create([
            'employee_id' => $employee->id,
            'amount' => 2000.00,
            'remaining_balance' => 2000.00,
            'advancement_date' => now()->toDateString(),
            'status' => 'paid_out',
        ]);

        // Total Initial Debt = 1,000.00 + 2,000.00 = 3,000.00

        // 3. Create a Payroll with 1,500.00 total cash advance deduction
        $payroll = Payroll::create([
            'employee_id' => $employee->id,
            'period_start' => now()->startOfMonth()->toDateString(),
            'period_end' => now()->endOfMonth()->toDateString(),
            'payroll_date' => now()->endOfMonth()->toDateString(),
            'days_worked' => 10,
            'total_days' => 10,
            'total_hours' => 80,
            'hours_worked' => 80,
            'hourly_rate' => 62.50,
            'basic_pay' => 5000.00,
            'gross_pay' => 5000.00,
            'cash_advance_payout' => 0.00,
            'cash_advance_deduction' => 1500.00,
            'deductions' => 1500.00,
            'net_pay' => 3500.00,
            'status' => 'draft',
        ]);

        // 4. Mark Payroll as 'paid'
        $response = $this->actingAs($admin)
            ->patch(route('payroll.update-status', $payroll->id), [
                'status' => 'paid',
            ]);

        $response->assertSessionHasNoErrors();
        $this->assertEquals('paid', $payroll->fresh()->status);

        // Assert deductions recorded correctly: Adv #1 = 1000.00, Adv #2 = 500.00
        $this->assertEquals(0.00, (float) $adv1->fresh()->remaining_balance);
        $this->assertEquals('deducted', $adv1->fresh()->status);

        $this->assertEquals(1500.00, (float) $adv2->fresh()->remaining_balance);
        $this->assertEquals('partially_deducted', $adv2->fresh()->status);

        // Assert ledger entries created
        $this->assertDatabaseHas('advancement_deductions', [
            'advancement_id' => $adv1->id,
            'payroll_id' => $payroll->id,
            'amount_deducted' => 1000.00,
        ]);
        $this->assertDatabaseHas('advancement_deductions', [
            'advancement_id' => $adv2->id,
            'payroll_id' => $payroll->id,
            'amount_deducted' => 500.00,
        ]);

        // 5. Revert Payroll status back to 'draft'
        $revertResponse = $this->actingAs($admin)
            ->patch(route('payroll.update-status', $payroll->id), [
                'status' => 'draft',
            ]);

        $revertResponse->assertSessionHasNoErrors();

        // 6. VERIFY: Balances MUST return EXACTLY to pre-payroll numbers (1,000.00 and 2,000.00)
        $this->assertEquals(1000.00, (float) $adv1->fresh()->remaining_balance, 'Adv #1 balance must revert to 1000.00');
        $this->assertEquals('paid_out', $adv1->fresh()->status);

        $this->assertEquals(2000.00, (float) $adv2->fresh()->remaining_balance, 'Adv #2 balance must revert to 2000.00');
        $this->assertEquals('paid_out', $adv2->fresh()->status);

        // Ledger entries must be cleared
        $this->assertDatabaseMissing('advancement_deductions', [
            'payroll_id' => $payroll->id,
        ]);
    }
}
