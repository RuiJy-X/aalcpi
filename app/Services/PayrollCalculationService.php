<?php

namespace App\Services;

use App\Models\Employee;
use App\Models\Payroll;
use App\Models\Attendance;
use App\Utils\PayrollCalculationHelper;
use Carbon\Carbon;

class PayrollCalculationService
{
    /**
     * Generate payroll for an employee
     *
     * @param Employee $employee
     * @param Carbon $periodStart
     * @param Carbon $periodEnd
     * @param int $holidays
     * @param float $deductions
     * @return Payroll
     */
    public function generatePayroll(
        Employee $employee,
        Carbon $periodStart,
        Carbon $periodEnd,
        int $holidays,
        float $deductions,
        ?float $totalHours = null
    ): Payroll {
        $hourlyRate = floatval($employee->hourly_rate ?? 0);
        $totalHours = $totalHours ?? $this->calculateTotalHours($employee, $periodStart, $periodEnd);

        $summary = $this->calculateSimplePayroll(
            hourlyRate: $hourlyRate,
            totalHours: $totalHours,
            holidays: $holidays,
            deductions: $deductions,
        );

        // Create or update payroll record
        $payroll = Payroll::updateOrCreate(
            [
                'employee_id' => $employee->id,
                'period_start' => $periodStart,
                'period_end' => $periodEnd,
            ],
            [
                'basic_pay' => $summary['basic_pay'],
                'holidays' => $holidays,
                'gross_pay' => $summary['gross_pay'],
                'deductions' => $deductions,
                'net_pay' => $summary['net_pay'],
                'status' => 'draft',
            ]
        );

        return $payroll;
    }

    /**
     * Calculate basic pay for the period
     * Basic pay = hourly_rate * total_hours_worked
     *
     * @param Employee $employee
     * @param Carbon $periodStart
     * @param Carbon $periodEnd
     * @return float
     */
    private function calculateTotalHours(
        Employee $employee,
        Carbon $periodStart,
        Carbon $periodEnd
    ): float {
        return (float) Attendance::query()
            ->where('employee_id', $employee->id)
            ->whereBetween('date', [$periodStart, $periodEnd])
            ->sum('working_time');
    }

    /**
     * @return array{basic_pay: float, holiday_pay: float, gross_pay: float, net_pay: float}
     */
    public function calculateSimplePayroll(
        float $hourlyRate,
        float $totalHours,
        int $holidays,
        float $deductions
    ): array {
        $basicPay = round($hourlyRate * $totalHours, 2);
        $holidayPay = round($hourlyRate * 8 * $holidays, 2);
        $grossPay = $basicPay + $holidayPay;
        $netPay = PayrollCalculationHelper::calculateNetPay($grossPay, $deductions);

        return [
            'basic_pay' => $basicPay,
            'holiday_pay' => $holidayPay,
            'gross_pay' => $grossPay,
            'net_pay' => $netPay,
        ];
    }

    /**
     * Recalculate net pay when deductions change
     *
     * @param Payroll $payroll
     * @param float $newDeductions
     * @return Payroll
     */
    public function updateDeductions(Payroll $payroll, float $newDeductions): Payroll
    {
        $netPay = PayrollCalculationHelper::calculateNetPay($payroll->gross_pay, $newDeductions);

        $payroll->update([
            'deductions' => $newDeductions,
            'net_pay' => $netPay,
        ]);

        return $payroll;
    }
}
