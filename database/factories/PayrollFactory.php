<?php

namespace Database\Factories;

use App\Models\Employee;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Payroll>
 */
class PayrollFactory extends Factory
{
    public function definition(): array
    {
        $periodStart = fake()->dateTimeBetween('-6 months', 'now');
        $periodEnd = (clone $periodStart)->modify('+14 days');
        $baseSalary = fake()->randomFloat(2, 12000, 80000);
        $overtimeHours = fake()->randomFloat(2, 0, 40);
        $deductions = fake()->randomFloat(2, 0, 5000);
        $grossPay = $baseSalary + ($overtimeHours * fake()->randomFloat(2, 50, 300));
        $netPay = max(0, $grossPay - $deductions);

        return [
            'employee_id' => Employee::factory(),
            'period_start' => $periodStart->format('Y-m-d'),
            'period_end' => $periodEnd->format('Y-m-d'),
            'base_salary' => $baseSalary,
            'total_overtime_hours' => $overtimeHours,
            'total_deductions' => $deductions,
            'gross_pay' => $grossPay,
            'net_pay' => $netPay,
            'status' => fake()->randomElement(['draft', 'released', 'paid']),
        ];
    }

    public function forEmployee(Employee $employee): static
    {
        return $this->state(fn () => [
            'employee_id' => $employee->id,
        ]);
    }
}
