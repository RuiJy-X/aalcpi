<?php

use App\Utils\PayrollCalculationHelper;

test('calculateDailyRate divides monthly salary by 30 days by default', function () {
    $monthlySalary = 16500.00;
    $dailyRate = PayrollCalculationHelper::calculateDailyRate($monthlySalary);

    expect($dailyRate)->toBe(550.0);
});

test('calculateHourlyRate uses 30 days per month and 8 hours per day', function () {
    $monthlySalary = 16500.00;
    $hourlyRate = PayrollCalculationHelper::calculateHourlyRate($monthlySalary);

    // 550 / 8 = 68.75
    expect($hourlyRate)->toBe(68.75);
});

test('calculatePagibigContribution calculates 2 percent of monthly salary', function () {
    $monthlySalary = 16500.00;
    $pagibig = PayrollCalculationHelper::calculatePagibigContribution($monthlySalary);

    // 16500 * 0.02 = 330.00
    expect($pagibig)->toBe(330.00);
});
