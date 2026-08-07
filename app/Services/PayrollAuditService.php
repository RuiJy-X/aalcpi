<?php

namespace App\Services;

use App\Models\Employee;
use App\Models\Attendance;
use Carbon\Carbon;

class PayrollAuditService
{
    /**
     * Audit all employees for a given pay period date range
     *
     * @param Carbon $periodStart
     * @param Carbon $periodEnd
     * @return array{
     *     period_start: string,
     *     period_end: string,
     *     ready: array,
     *     action_required: array,
     *     totals: array
     * }
     */
    public function auditBatch(Carbon $periodStart, Carbon $periodEnd): array
    {
        $employees = Employee::query()->orderBy('employee_code')->get();

        $readyList = [];
        $actionRequiredList = [];

        $totalBatchGross = 0.00;
        $totalBatchDeductions = 0.00;
        $totalBatchNet = 0.00;

        foreach ($employees as $employee) {
            $attendances = Attendance::query()
                ->where('employee_id', $employee->id)
                ->whereBetween('date', [$periodStart->toDateString(), $periodEnd->toDateString()])
                ->get();

            $daysWorked = $attendances->pluck('date')->unique()->count();
            $hoursWorked = (float) $attendances->sum('working_time');

            $dailyRate = (float) ($employee->daily_rate ?? 0);
            $hasDailyRate = $dailyRate > 0;
            $hasAttendance = $daysWorked > 0;

            $reasons = [];
            if (!$hasAttendance) {
                $reasons[] = 'Missing Attendance Data (' . $periodStart->format('M d') . ' - ' . $periodEnd->format('M d') . ')';
            }
            if (!$hasDailyRate) {
                $reasons[] = 'Daily Rate / Pay Setup Incomplete (₱0.00)';
            }

            // Calculations
            $grossEarnings = round($dailyRate * $daysWorked, 2);
            $overtimePay = 0.00; // OT / Holiday pay
            $totalEarnings = $grossEarnings + $overtimePay;

            $sssLoan = (float) ($employee->sss_loan ?? 0);
            $pagibigLoan = (float) ($employee->pagibig_loan ?? 0);
            $emergencyLoan = (float) ($employee->emergency_loan ?? 0);

            $pagibigContrib = (float) ($employee->pagibig_contribution ?? 200.00);
            $sssContrib = (float) ($employee->sss_contribution ?? 0);
            $philhealthContrib = (float) ($employee->philhealth_contribution ?? 0);
            $withholdingTax = (float) ($employee->withholding_tax ?? 0);

            $totalDeductions = round(
                $sssLoan + $pagibigLoan + $emergencyLoan +
                $pagibigContrib + $sssContrib + $philhealthContrib + $withholdingTax,
                2
            );

            $netAmount = max(0.00, round($totalEarnings - $totalDeductions, 2));

            $employeeItem = [
                'employee_id'               => $employee->id,
                'employee_code'             => $employee->employee_code,
                'name'                      => $employee->name,
                'position'                  => $employee->position ?? 'Encoder',
                'daily_rate'                => $dailyRate,
                'base_salary'               => (float) ($employee->base_salary ?? 0),
                'hourly_rate'               => (float) ($employee->hourly_rate ?? 0),
                'days_worked'               => $daysWorked,
                'hours_worked'              => $hoursWorked,
                'gross_earnings'            => $grossEarnings,
                'overtime_pay'              => $overtimePay,
                'total_earnings'            => $totalEarnings,
                'sss_loan'                  => $sssLoan,
                'pagibig_loan'              => $pagibigLoan,
                'emergency_loan'            => $emergencyLoan,
                'pagibig_contribution'      => $pagibigContrib,
                'sss_contribution'          => $sssContrib,
                'philhealth_contribution'    => $philhealthContrib,
                'withholding_tax'           => $withholdingTax,
                'total_deductions'          => $totalDeductions,
                'net_amount'                => $netAmount,
                'tin'                       => $employee->tin,
                'sss_no'                    => $employee->sss_no,
                'pagibig_no'                => $employee->pagibig_no,
                'philhealth_no'             => $employee->philhealth_no,
                'contact_number'            => $employee->contact_number,
                'address'                   => $employee->address,
                'reasons'                   => $reasons,
            ];

            if ($hasAttendance && $hasDailyRate) {
                $readyList[] = $employeeItem;
                $totalBatchGross += $totalEarnings;
                $totalBatchDeductions += $totalDeductions;
                $totalBatchNet += $netAmount;
            } else {
                $actionRequiredList[] = $employeeItem;
            }
        }

        return [
            'period_start' => $periodStart->toDateString(),
            'period_end'   => $periodEnd->toDateString(),
            'ready'        => $readyList,
            'action_required' => $actionRequiredList,
            'totals'       => [
                'total_gross' => round($totalBatchGross, 2),
                'total_deductions' => round($totalBatchDeductions, 2),
                'total_net' => round($totalBatchNet, 2),
                'ready_count' => count($readyList),
                'action_required_count' => count($actionRequiredList),
            ],
        ];
    }
}
