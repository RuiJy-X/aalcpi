<?php

namespace App\Services;

use App\Models\Employee;
use App\Models\Attendance;
use App\Models\Advancement;
use App\Models\Payroll;
use App\Models\Holiday;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;

class PayrollAuditService
{
    /**
     * Perform pre-payroll audit for all employees over a date range.
     *
     * Categorizes employees into:
     *  - ready: Attendance present & daily_rate configured
     *  - action_required: Attendance missing or daily_rate = 0 or already paid
     */
    public function auditBatch(CarbonInterface $periodStart, CarbonInterface $periodEnd): array
    {
        $employees = Employee::orderBy('name')->get();
        
        // Pre-fetch attendances for performance
        $attendances = Attendance::whereBetween('date', [
            $periodStart->toDateString(),
            $periodEnd->toDateString(),
        ])->get()->groupBy('employee_id');

        $readyList = [];
        $actionRequiredList = [];

        $totalBatchGross = 0.00;
        $totalBatchDeductions = 0.00;
        $totalBatchNet = 0.00;

        foreach ($employees as $employee) {
            $empAttendance = $attendances->get($employee->id, collect());
            
            // Only count actual worked days (where working_time > 0 or punch logs exist)
            $workedAttendance = $empAttendance->filter(function ($att) {
                if ($att->working_time !== null) {
                    return (float) $att->working_time > 0;
                }
                return !empty($att->time_in);
            });
            $daysWorked = $workedAttendance->count();
            $hoursWorked = $empAttendance->sum('hours_worked');

            $hasAttendance = $daysWorked > 0;
            $dailyRate = (float) ($employee->daily_rate ?? 0);
            $hasDailyRate = $dailyRate > 0;

            $reasons = [];

            // Overlapping payroll check (Draft or Paid)
            $existingPayroll = Payroll::where('employee_id', $employee->id)
                ->whereDate('period_start', '<=', $periodEnd)
                ->whereDate('period_end', '>=', $periodStart)
                ->first();

            $isPaid = $existingPayroll && $existingPayroll->status === 'paid';
            $isDraft = $existingPayroll && $existingPayroll->status === 'draft';

            if ($isPaid) {
                $pStart = Carbon::parse($existingPayroll->period_start)->format('M d');
                $pEnd = Carbon::parse($existingPayroll->period_end)->format('M d');
                $reasons[] = "Already Paid: Finalized payroll exists for {$pStart} - {$pEnd}";
            }

            if (!$hasAttendance) {
                $reasons[] = 'Missing Attendance Data (' . $periodStart->format('M d') . ' - ' . $periodEnd->format('M d') . ')';
            }
            if (!$hasDailyRate) {
                $reasons[] = 'Daily Rate / Pay Setup Incomplete (₱0.00)';
            }

            // Calculate total hours and daily overtime hours beyond 8.0 hours
            $totalHoursWorked = 0.00;
            $totalOvertimeHours = 0.00;

            foreach ($empAttendance as $att) {
                $workHrs = 0.00;
                if ($att->working_time !== null) {
                    $workHrs = (float) $att->working_time;
                } elseif (!empty($att->time_in) && !empty($att->time_out)) {
                    try {
                        $in = Carbon::parse($att->time_in);
                        $out = Carbon::parse($att->time_out);
                        $diffInMinutes = $out->diffInMinutes($in);
                        $workHrs = round(max(0, $diffInMinutes - 60) / 60, 2);
                    } catch (\Exception $e) {
                        $workHrs = 0.00;
                    }
                } elseif (!empty($att->time_in)) {
                    $workHrs = 8.00;
                }

                $totalHoursWorked += $workHrs;
                if ($workHrs > 8.00) {
                    $totalOvertimeHours += ($workHrs - 8.00);
                }
            }

            $totalOvertimeHours = round($totalOvertimeHours, 2);

            $hourlyRate = (float) ($employee->hourly_rate ?? 0);
            if ($hourlyRate <= 0 && $dailyRate > 0) {
                $hourlyRate = $dailyRate / 8.00;
            }

            // Cash Advancement Payouts (Date-matched for current cutoff)
            $pendingAdvancements = Advancement::where('employee_id', $employee->id)
                ->where('status', 'pending_payout')
                ->whereDate('advancement_date', '>=', $periodStart)
                ->whereDate('advancement_date', '<=', $periodEnd)
                ->get();
            $cashAdvancePayout = (float) $pendingAdvancements->sum('amount');

            // Auto-detect registered holidays within period date range
            $detectedHolidaysCount = Holiday::whereBetween('date', [
                $periodStart->toDateString(),
                $periodEnd->toDateString(),
            ])->count();

            $holidaysCount = max($detectedHolidaysCount, (int) ($employee->holidays ?? 0));
            $holidayPay = round($dailyRate * $holidaysCount, 2);

            // Calculations
            $basicPay = round($dailyRate * $daysWorked, 2);
            $overtimePay = round($totalOvertimeHours * $hourlyRate, 2);
            $grossEarnings = $basicPay;
            $totalEarnings = round($basicPay + $overtimePay + $holidayPay + $cashAdvancePayout, 2);

            $sssContrib = (float) ($employee->sss_contribution ?? 0);
            $sssLoan = (float) ($employee->sss_loan ?? 0);
            $pagibigContrib = (float) ($employee->pagibig_contribution ?? 0);
            $philhealthContrib = (float) ($employee->philhealth_contribution ?? 0);
            $emergencyLoan = (float) ($employee->emergency_loan ?? 0);
            $withholdingTax = (float) ($employee->withholding_tax ?? 0);

            $baseDeductions = round(
                $sssContrib + $sssLoan + $pagibigContrib + $philhealthContrib + $emergencyLoan + $withholdingTax,
                2
            );

            // Cash Advancement Repayment Deductions (Next payroll carrying unpaid remaining_balance)
            $repayableAdvancements = Advancement::where('employee_id', $employee->id)
                ->whereIn('status', ['paid_out', 'partially_deducted'])
                ->where('remaining_balance', '>', 0)
                ->get();

            $totalTargetDeduction = (float) $repayableAdvancements->sum(function ($adv) {
                $rem = (float) $adv->remaining_balance;
                $installment = ($adv->installment_amount && (float) $adv->installment_amount > 0)
                    ? (float) $adv->installment_amount
                    : $rem;
                return min($rem, $installment);
            });

            $maxDeductibleCapacity = max(0.00, round($totalEarnings - $baseDeductions, 2));
            $cashAdvanceDeduction = min($totalTargetDeduction, $maxDeductibleCapacity);

            $totalDeductions = round($baseDeductions + $cashAdvanceDeduction, 2);
            $netAmount = max(0.00, round($totalEarnings - $totalDeductions, 2));

            $employeeItem = [
                'employee_id'               => $employee->id,
                'employee_code'             => $employee->employee_code,
                'name'                      => $employee->name,
                'position'                  => $employee->position ?? 'Encoder',
                'daily_rate'                => $dailyRate,
                'base_salary'               => (float) ($employee->base_salary ?? 0),
                'hourly_rate'               => $hourlyRate,
                'days_worked'               => $daysWorked,
                'hours_worked'              => $totalHoursWorked > 0 ? $totalHoursWorked : $hoursWorked,
                'basic_pay'                 => $basicPay,
                'gross_earnings'            => $basicPay,
                'overtime_hours'            => $totalOvertimeHours,
                'overtime_pay'              => $overtimePay,
                'holidays'                  => $holidaysCount,
                'holiday_pay'               => $holidayPay,
                'cash_advance_payout'        => $cashAdvancePayout,
                'cash_advance_deduction'     => $cashAdvanceDeduction,
                'total_earnings'            => $totalEarnings,
                'sss_contribution'          => $sssContrib,
                'sss_loan'                  => $sssLoan > 0 ? $sssLoan : $sssContrib,
                'pagibig_contribution'      => $pagibigContrib,
                'philhealth_contribution'    => $philhealthContrib,
                'emergency_loan'            => $emergencyLoan,
                'withholding_tax'           => $withholdingTax,
                'total_deductions'          => $totalDeductions,
                'net_amount'                => $netAmount,
                'pending_advancement_ids'   => $pendingAdvancements->pluck('id')->toArray(),
                'repayable_advancement_ids' => $repayableAdvancements->pluck('id')->toArray(),
                'tin'                       => $employee->tin,
                'sss_no'                    => $employee->sss_no,
                'pagibig_no'                => $employee->pagibig_no,
                'philhealth_no'             => $employee->philhealth_no,
                'contact_number'            => $employee->contact_number,
                'address'                   => $employee->address,
                'reasons'                   => $reasons,
                'is_draft'                  => $isDraft,
                'draft_payroll_id'          => $isDraft ? $existingPayroll->id : null,
                'is_paid'                   => $isPaid,
            ];

            if ($hasAttendance && $hasDailyRate && !$isPaid) {
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
            'period_end' => $periodEnd->toDateString(),
            'totals' => [
                'ready_count' => count($readyList),
                'action_required_count' => count($actionRequiredList),
                'total_ready' => count($readyList),
                'total_action_required' => count($actionRequiredList),
                'total_gross' => $totalBatchGross,
                'total_deductions' => $totalBatchDeductions,
                'total_net' => $totalBatchNet,
            ],
            'ready' => $readyList,
            'action_required' => $actionRequiredList,
        ];
    }
}
