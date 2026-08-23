<?php

namespace App\Utils;

use Carbon\Carbon;

class PayrollCalculationHelper
{
    /**
     * Calculate daily rate from salary
     */
    public static function calculateDailyRate(float $monthlySalary, int $workingDaysPerMonth = 30): float
    {
        if ($workingDaysPerMonth <= 0) {
            return 0;
        }

        return round($monthlySalary / $workingDaysPerMonth, 2);
    }

    /**
     * Calculate hourly rate from salary
     */
    public static function calculateHourlyRate(
        float $monthlySalary,
        int $workingDaysPerMonth = 30,
        int $hoursPerDay = 8
    ): float {
        if ($workingDaysPerMonth <= 0 || $hoursPerDay <= 0) {
            return 0;
        }

        $dailyRate = self::calculateDailyRate($monthlySalary, $workingDaysPerMonth);

        return round($dailyRate / $hoursPerDay, 2);
    }

    /**
     * Calculate pro-rated salary for partial period
     */
    public static function calculateProratedSalary(
        float $monthlySalary,
        Carbon $periodStart,
        Carbon $periodEnd,
        int $workingDaysPerMonth = 30
    ): float {
        $workingDaysInPeriod = self::countWorkingDays($periodStart, $periodEnd);
        $dailyRate = self::calculateDailyRate($monthlySalary, $workingDaysPerMonth);

        return round($dailyRate * $workingDaysInPeriod, 2);
    }

    /**
     * Count working days (excluding weekends) between two dates
     */
    public static function countWorkingDays(Carbon $startDate, Carbon $endDate): int
    {
        $workingDays = 0;
        $currentDate = $startDate->copy();

        while ($currentDate <= $endDate) {
            // Monday = 1, Sunday = 7, but dayOfWeek 0 is Sunday, 6 is Saturday
            $dayOfWeek = $currentDate->dayOfWeek;
            if ($dayOfWeek !== 0 && $dayOfWeek !== 6) { // Not Sunday or Saturday
                $workingDays++;
            }
            $currentDate->addDay();
        }

        return $workingDays;
    }

    /**
     * Calculate overtime pay
     */
    public static function calculateOvertimePay(
        float $hourlyRate,
        int $overtimeHours,
        float $overtimeMultiplier = 1.5
    ): float {
        return round($hourlyRate * $overtimeHours * $overtimeMultiplier, 2);
    }

    /**
     * Calculate Pag-IBIG contribution (2% of monthly salary)
     */
    public static function calculatePagibigContribution(float $monthlySalary, float $rate = 0.02): float
    {
        if ($monthlySalary <= 0) {
            return 0.00;
        }

        return round($monthlySalary * $rate, 2);
    }

    /**
     * Calculate net pay
     */
    public static function calculateNetPay(float $grossPay, float $deductions): float
    {
        return round(max(0, $grossPay - $deductions), 2);
    }

    /**
     * Format currency
     */
    public static function formatCurrency(float $amount, string $currency = '₱'): string
    {
        return $currency.number_format($amount, 2);
    }
}
