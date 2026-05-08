<?php

namespace App\Utils;

use Carbon\Carbon;

class PayrollCalculationHelper
{
    /**
     * Calculate daily rate from salary
     *
     * @param float $monthlySalary
     * @param int $workingDaysPerMonth
     * @return float
     */
    public static function calculateDailyRate(float $monthlySalary, int $workingDaysPerMonth = 26): float
    {
        if ($workingDaysPerMonth <= 0) {
            return 0;
        }

        return round($monthlySalary / $workingDaysPerMonth, 2);
    }

    /**
     * Calculate hourly rate from salary
     *
     * @param float $monthlySalary
     * @param int $workingDaysPerMonth
     * @param int $hoursPerDay
     * @return float
     */
    public static function calculateHourlyRate(
        float $monthlySalary,
        int $workingDaysPerMonth = 26,
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
     *
     * @param float $monthlySalary
     * @param Carbon $periodStart
     * @param Carbon $periodEnd
     * @param int $workingDaysPerMonth
     * @return float
     */
    public static function calculateProratedSalary(
        float $monthlySalary,
        Carbon $periodStart,
        Carbon $periodEnd,
        int $workingDaysPerMonth = 26
    ): float {
        $workingDaysInPeriod = self::countWorkingDays($periodStart, $periodEnd);
        $dailyRate = self::calculateDailyRate($monthlySalary, $workingDaysPerMonth);

        return round($dailyRate * $workingDaysInPeriod, 2);
    }

    /**
     * Count working days (excluding weekends) between two dates
     *
     * @param Carbon $startDate
     * @param Carbon $endDate
     * @return int
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
     *
     * @param float $hourlyRate
     * @param int $overtimeHours
     * @param float $overtimeMultiplier
     * @return float
     */
    public static function calculateOvertimePay(
        float $hourlyRate,
        int $overtimeHours,
        float $overtimeMultiplier = 1.5
    ): float {
        return round($hourlyRate * $overtimeHours * $overtimeMultiplier, 2);
    }

    /**
     * Calculate net pay
     *
     * @param float $grossPay
     * @param float $deductions
     * @return float
     */
    public static function calculateNetPay(float $grossPay, float $deductions): float
    {
        return round(max(0, $grossPay - $deductions), 2);
    }

    /**
     * Format currency
     *
     * @param float $amount
     * @param string $currency
     * @return string
     */
    public static function formatCurrency(float $amount, string $currency = '₱'): string
    {
        return $currency . number_format($amount, 2);
    }
}
