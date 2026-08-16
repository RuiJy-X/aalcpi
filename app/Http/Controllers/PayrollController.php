<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Concerns\HandlesBulkUpdates;
use App\Http\Requests\GeneratePayrollRequest;
use App\Http\Requests\PreviewPayrollRequest;
use App\Models\Payroll;
use App\Models\Employee;
use App\Models\Attendance;
use App\Models\Advancement;
use App\Models\AdvancementDeduction;
use App\Imports\AttendanceImport;
use App\Services\PayrollCalculationService;
use App\Services\PayrollAuditService;
use Carbon\Carbon;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;
use Barryvdh\DomPDF\Facade\Pdf;

class PayrollController extends Controller
{
    use HandlesBulkUpdates;

    protected PayrollCalculationService $payrollService;
    protected PayrollAuditService $auditService;

    public function __construct(
        PayrollCalculationService $payrollService,
        PayrollAuditService $auditService
    ) {
        $this->payrollService = $payrollService;
        $this->auditService = $auditService;
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $payrolls = Payroll::with('employee:id,name,employee_code,position,daily_rate,sss_contribution,pagibig_contribution,philhealth_contribution,emergency_loan,withholding_tax')
            ->latest('period_end')
            ->get()
            ->map(function (Payroll $record) {
                $payout = (float) ($record->cash_advance_payout ?? 0);
                if ($payout <= 0) {
                    $payout = (float) Advancement::where('payout_payroll_id', $record->id)->sum('amount');
                }

                $deduction = (float) ($record->cash_advance_deduction ?? 0);
                if ($deduction <= 0) {
                    $deduction = (float) Advancement::where('deduction_payroll_id', $record->id)->sum('amount');
                }

                return [
                    'id'                     => $record->id,
                    'employee_id'            => $record->employee_id,
                    'employee_code'          => $record->employee?->employee_code ?? ('EMP-' . str_pad((string) $record->employee_id, 3, '0', STR_PAD_LEFT)),
                    'employee_name'          => $record->employee?->name ?? 'N/A',
                    'position'               => $record->employee?->position ?? 'Encoder',
                    'daily_rate'             => (float) ($record->employee?->daily_rate ?? 0),
                    'period_start'           => $record->period_start?->toDateString(),
                    'period_end'             => $record->period_end?->toDateString(),
                    'payroll_date'           => $record->payroll_date?->toDateString(),
                    'days_worked'            => $record->days_worked,
                    'total_days'             => $record->total_days,
                    'total_hours'            => $record->total_hours,
                    'hours_worked'           => $record->hours_worked,
                    'hourly_rate'            => $record->hourly_rate,
                    'basic_pay'              => (float) $record->basic_pay,
                    'overtime_pay'           => (float) ($record->overtime_pay ?? max(0, (float) $record->gross_pay - (float) $record->basic_pay - $payout)),
                    'overtime_hours'         => (float) ($record->overtime_hours ?? 0),
                    'holidays'               => $record->holidays,
                    'holiday_pay'            => (float) ($record->holiday_pay ?? round((float) ($record->employee?->daily_rate ?? 0) * (int) $record->holidays, 2)),
                    'gross_pay'              => (float) $record->gross_pay,
                    'cash_advance_payout'    => $payout,
                    'cash_advance_deduction' => $deduction,
                    'sss_loan'               => (float) ($record->sss_loan ?? $record->employee?->sss_contribution ?? $record->employee?->sss_loan ?? 0),
                    'pagibig_loan'           => (float) ($record->pagibig_loan ?? $record->employee?->pagibig_loan ?? 0),
                    'emergency_loan'         => (float) ($record->emergency_loan ?? $record->employee?->emergency_loan ?? 0),
                    'deductions'             => (float) $record->deductions,
                    'net_pay'                => (float) $record->net_pay,
                    'status'                 => $record->status,
                    'created_at'             => $record->created_at?->toDateTimeString(),
                    'updated_at'             => $record->updated_at?->toDateTimeString(),
                ];
            });

        return Inertia::render('Payroll/Index', [
            'payrolls' => $payrolls,
        ]);
    }

    /**
     * Render the dedicated Payroll Batch Generation & Pre-Audit Hub page
     */
    public function create()
    {
        // Default range: 10th - 25th of current month (1st cutoff)
        $start = Carbon::now()->setDate(Carbon::now()->year, Carbon::now()->month, 10);
        $end = Carbon::now()->setDate(Carbon::now()->year, Carbon::now()->month, 25);

        $initialBatchData = $this->auditService->auditBatch($start, $end);

        return Inertia::render('Payroll/Generate', [
            'initialBatchData' => $initialBatchData,
        ]);
    }

    /**
     * Preview audited payroll batch for a given date range
     */
    public function previewBatch(Request $request)
    {
        $validated = $request->validate([
            'period_start' => 'required|date',
            'period_end'   => 'required|date|after_or_equal:period_start',
        ]);

        $start = Carbon::parse($validated['period_start']);
        $end = Carbon::parse($validated['period_end']);

        $batchData = $this->auditService->auditBatch($start, $end);

        return response()->json($batchData);
    }

    /**
     * Upload an Excel attendance file and re-audit batch
     */
    public function uploadAttendanceBatch(Request $request)
    {
        $validated = $request->validate([
            'attendance_file' => 'required|file|mimes:xlsx,xls,csv',
            'period_start'    => 'required|date',
            'period_end'      => 'required|date|after_or_equal:period_start',
        ]);

        try {
            $import = new AttendanceImport(persist: true);
            Excel::import($import, $validated['attendance_file']);

            $start = Carbon::parse($validated['period_start']);
            $end = Carbon::parse($validated['period_end']);

            $batchData = $this->auditService->auditBatch($start, $end);

            return response()->json([
                'success'   => true,
                'message'   => "Successfully imported attendance records!",
                'batchData' => $batchData,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error importing attendance: ' . $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Quick update employee setup parameters directly on the batch generation page
     */
    public function quickUpdateEmployee(Request $request, Employee $employee)
    {
        $validated = $request->validate([
            'daily_rate'              => 'required|numeric|min:0',
            'holidays'                => 'nullable|integer|min:0',
            'sss_contribution'        => 'nullable|numeric|min:0',
            'pagibig_contribution'    => 'nullable|numeric|min:0',
            'philhealth_contribution' => 'nullable|numeric|min:0',
            'emergency_loan'          => 'nullable|numeric|min:0',
            'withholding_tax'         => 'nullable|numeric|min:0',
            'period_start'            => 'required|date',
            'period_end'              => 'required|date|after_or_equal:period_start',
        ]);

        $hoursPerDay = 8;
        $daysPerMonth = 30;

        $dailyRate = (float) $validated['daily_rate'];
        $validated['hourly_rate'] = number_format($dailyRate / $hoursPerDay, 2, '.', '');
        $validated['base_salary'] = number_format($dailyRate * $daysPerMonth, 2, '.', '');

        $employee->update($validated);

        $start = Carbon::parse($validated['period_start']);
        $end = Carbon::parse($validated['period_end']);

        $batchData = $this->auditService->auditBatch($start, $end);

        return response()->json([
            'success'   => true,
            'message'   => "Updated pay setup for {$employee->name}!",
            'batchData' => $batchData,
        ]);
    }

    /**
     * Process and save audited batch payroll records
     */
    public function processBatch(Request $request)
    {
        $validated = $request->validate([
            'period_start' => 'required|date',
            'period_end'   => 'required|date|after_or_equal:period_start',
            'employee_ids' => 'nullable|array',
        ]);

        $start = Carbon::parse($validated['period_start']);
        $end = Carbon::parse($validated['period_end']);

        $batchData = $this->auditService->auditBatch($start, $end);
        $readyEmployees = $batchData['ready'];

        if (empty($readyEmployees)) {
            return redirect()->back()->withErrors([
                'batch' => 'No ready employees available to process for this date range.',
            ]);
        }

        $allowedIds = isset($validated['employee_ids']) ? array_map('intval', $validated['employee_ids']) : null;

        $savedCount = 0;
        foreach ($readyEmployees as $empData) {
            if ($allowedIds !== null && !in_array($empData['employee_id'], $allowedIds, true)) {
                continue;
            }

            // Skip if employee already has a PAID payroll in this date range
            $existingPaid = Payroll::where('employee_id', $empData['employee_id'])
                ->where('status', 'paid')
                ->whereDate('period_start', '<=', $end)
                ->whereDate('period_end', '>=', $start)
                ->exists();

            if ($existingPaid) {
                continue;
            }

            // Search for an existing DRAFT payroll row for this employee matching or overlapping the period
            $existingDraft = Payroll::where('employee_id', $empData['employee_id'])
                ->where('status', 'draft')
                ->where(function ($q) use ($start, $end) {
                    $q->where(function ($sub) use ($start, $end) {
                        $sub->whereDate('period_start', '<=', $end->toDateString())
                            ->whereDate('period_end', '>=', $start->toDateString());
                    })
                    ->orWhere(function ($sub) use ($start, $end) {
                        $sub->where('period_start', $start->toDateString())
                            ->where('period_end', $end->toDateString());
                    });
                })
                ->first();

            $payrollData = [
                'employee_id'            => $empData['employee_id'],
                'period_start'           => $start->toDateString(),
                'period_end'             => $end->toDateString(),
                'payroll_date'           => $end->toDateString(),
                'days_worked'            => $empData['days_worked'],
                'total_days'             => $empData['days_worked'],
                'total_hours'            => $empData['hours_worked'],
                'hours_worked'           => $empData['hours_worked'],
                'hourly_rate'            => $empData['hourly_rate'],
                'basic_pay'              => $empData['basic_pay'] ?? $empData['gross_earnings'],
                'overtime_pay'           => $empData['overtime_pay'] ?? 0.00,
                'overtime_hours'         => $empData['overtime_hours'] ?? 0.00,
                'holidays'               => $empData['holidays'] ?? 0,
                'holiday_pay'            => $empData['holiday_pay'] ?? 0.00,
                'gross_pay'              => $empData['total_earnings'],
                'cash_advance_payout'    => $empData['cash_advance_payout'] ?? 0.00,
                'cash_advance_deduction' => $empData['cash_advance_deduction'] ?? 0.00,
                'sss_loan'               => $empData['sss_contribution'] ?? $empData['sss_loan'] ?? 0.00,
                'pagibig_loan'           => $empData['pagibig_loan'] ?? 0.00,
                'emergency_loan'         => $empData['emergency_loan'] ?? 0.00,
                'deductions'             => $empData['total_deductions'],
                'net_pay'                => $empData['net_amount'],
                'status'                 => 'draft',
            ];

            if ($existingDraft) {
                $existingDraft->update($payrollData);
                $payrollRecord = $existingDraft;
            } else {
                $payrollRecord = Payroll::create($payrollData);
            }

            // Link Advancement Payouts to this draft payroll without prematurely setting status to paid_out
            if (!empty($empData['pending_advancement_ids'])) {
                Advancement::whereIn('id', $empData['pending_advancement_ids'])->update([
                    'payout_payroll_id' => $payrollRecord->id,
                ]);
            }

            $savedCount++;
        }

        $msg = $savedCount === 1
            ? "Successfully generated draft payroll for 1 employee!"
            : "Successfully generated payroll batch for {$savedCount} employees!";

        $updatedBatchData = $this->auditService->auditBatch($start, $end);

        if ($request->wantsJson() || $request->ajax() || $request->header('X-Requested-With') === 'XMLHttpRequest') {
            return response()->json([
                'success'   => true,
                'message'   => $msg,
                'savedCount'=> $savedCount,
                'batchData' => $updatedBatchData,
            ]);
        }

        return redirect()->back()->with('success', $msg);
    }

    /**
     * Stream individual employee payslip PDF
     */
    public function downloadPayslipPdf($id)
    {
        $payrollRecord = Payroll::with('employee')->findOrFail($id);
        $employee = $payrollRecord->employee;

        $cashAdvancePayout = (float) (($payrollRecord->cash_advance_payout ?? 0) > 0 ? $payrollRecord->cash_advance_payout : Advancement::where('payout_payroll_id', $payrollRecord->id)->sum('amount'));
        $cashAdvanceDeduction = (float) (($payrollRecord->cash_advance_deduction ?? 0) > 0 ? $payrollRecord->cash_advance_deduction : Advancement::where('deduction_payroll_id', $payrollRecord->id)->sum('amount'));

        $payroll = [
            'id'                     => $payrollRecord->id,
            'employee_code'          => $employee?->employee_code ?? ('EMP-' . str_pad((string) $payrollRecord->employee_id, 3, '0', STR_PAD_LEFT)),
            'employee_name'          => $employee?->name ?? 'N/A',
            'position'               => $employee?->position ?? 'Encoder',
            'daily_rate'             => (float) ($employee?->daily_rate ?? ($payrollRecord->hourly_rate * 8)),
            'period_start'           => $payrollRecord->period_start?->toDateString(),
            'period_end'             => $payrollRecord->period_end?->toDateString(),
            'days_worked'            => $payrollRecord->days_worked ?? 0,
            'basic_pay'              => (float) $payrollRecord->basic_pay,
            'cash_advance_payout'    => $cashAdvancePayout,
            'cash_advance_deduction' => $cashAdvanceDeduction,
            'overtime_pay'           => max(0, (float) $payrollRecord->gross_pay - (float) $payrollRecord->basic_pay - $cashAdvancePayout),
            'gross_pay'              => (float) $payrollRecord->gross_pay,
            'sss_loan'               => (float) ($payrollRecord->sss_loan ?? $employee?->sss_contribution ?? $employee?->sss_loan ?? 0),
            'pagibig_loan'           => (float) ($payrollRecord->pagibig_loan ?? $employee?->pagibig_loan ?? 0),
            'emergency_loan'         => (float) ($payrollRecord->emergency_loan ?? $employee?->emergency_loan ?? 0),
            'pagibig_contribution'   => (float) ($employee?->pagibig_contribution ?? 200.00),
            'sss_contribution'       => (float) ($payrollRecord->sss_loan ?? $employee?->sss_contribution ?? 0),
            'philhealth_contribution' => (float) ($employee?->philhealth_contribution ?? 0),
            'withholding_tax'        => (float) ($employee?->withholding_tax ?? 0),
            'deductions'             => (float) $payrollRecord->deductions,
            'net_pay'                => (float) $payrollRecord->net_pay,
        ];

        $pdf = Pdf::loadView('pdfs.employee_payslip', compact('payroll'))->setPaper('a5', 'portrait');

        return $pdf->stream("payslip_{$payrollRecord->employee_id}_{$payroll['period_start']}.pdf");
    }

    /**
     * Stream formal monochrome Statement of Account PDF for a payroll record
     */
    public function downloadStatementOfAccountPdf($id)
    {
        $payrollRecord = Payroll::with('employee')->findOrFail($id);
        $employee = $payrollRecord->employee;

        $advancements = Advancement::where('employee_id', $payrollRecord->employee_id)
            ->whereIn('status', ['pending_payout', 'paid_out', 'partially_deducted'])
            ->whereNotIn('status', ['cancelled', 'deducted', 'fully_repaid'])
            ->latest('advancement_date')
            ->get();

        $cashAdvancePayout = (float) (($payrollRecord->cash_advance_payout ?? 0) > 0 ? $payrollRecord->cash_advance_payout : Advancement::where('payout_payroll_id', $payrollRecord->id)->sum('amount'));
        $cashAdvanceDeduction = (float) (($payrollRecord->cash_advance_deduction ?? 0) > 0 ? $payrollRecord->cash_advance_deduction : Advancement::where('deduction_payroll_id', $payrollRecord->id)->sum('amount'));

        $soaNumber = 'SOA-' . ($employee?->employee_code ?? ('EMP-' . str_pad((string) $payrollRecord->employee_id, 3, '0', STR_PAD_LEFT))) . '-' . now()->format('Ymd');
        $dateIssued = now()->format('F d, Y');

        $data = [
            'soa_number'             => $soaNumber,
            'date_issued'            => $dateIssued,
            'payroll_id'             => $payrollRecord->id,
            'employee_code'          => $employee?->employee_code ?? ('EMP-' . str_pad((string) $payrollRecord->employee_id, 3, '0', STR_PAD_LEFT)),
            'employee_name'          => $employee?->name ?? 'N/A',
            'position'               => $employee?->position ?? 'N/A',
            'address'                => $employee?->address ?? 'N/A',
            'contact_number'         => $employee?->contact_number ?? 'N/A',
            'tin'                    => $employee?->tin ?? 'N/A',
            'sss_no'                 => $employee?->sss_no ?? 'N/A',
            'pagibig_no'             => $employee?->pagibig_no ?? 'N/A',
            'philhealth_no'          => $employee?->philhealth_no ?? 'N/A',
            'daily_rate'             => (float) ($employee?->daily_rate ?? ($payrollRecord->hourly_rate * 8)),
            'period_start'           => $payrollRecord->period_start?->toDateString(),
            'period_end'             => $payrollRecord->period_end?->toDateString(),
            'days_worked'            => $payrollRecord->days_worked ?? 0,
            'total_hours'            => $payrollRecord->total_hours ?? 0,
            'basic_pay'              => (float) $payrollRecord->basic_pay,
            'overtime_hours'         => (float) ($payrollRecord->overtime_hours ?? 0),
            'overtime_pay'           => max(0, (float) $payrollRecord->gross_pay - (float) $payrollRecord->basic_pay - $cashAdvancePayout),
            'holidays'               => (int) ($payrollRecord->holidays ?? 0),
            'holiday_pay'            => (float) ($payrollRecord->holiday_pay ?? 0),
            'cash_advance_payout'    => $cashAdvancePayout,
            'gross_pay'              => (float) $payrollRecord->gross_pay,
            'sss_contribution'       => (float) ($employee?->sss_contribution ?? 0),
            'sss_loan'               => (float) ($payrollRecord->sss_loan ?? $employee?->sss_loan ?? 0),
            'pagibig_contribution'   => (float) ($employee?->pagibig_contribution ?? 200.00),
            'pagibig_loan'           => (float) ($payrollRecord->pagibig_loan ?? $employee?->pagibig_loan ?? 0),
            'philhealth_contribution' => (float) ($employee?->philhealth_contribution ?? 0),
            'emergency_loan'         => (float) ($payrollRecord->emergency_loan ?? $employee?->emergency_loan ?? 0),
            'withholding_tax'        => (float) ($employee?->withholding_tax ?? 0),
            'cash_advance_deduction' => $cashAdvanceDeduction,
            'deductions'             => (float) $payrollRecord->deductions,
            'net_pay'                => (float) $payrollRecord->net_pay,
            'advancements'           => $advancements,
        ];

        $pdf = Pdf::loadView('pdfs.statement_of_account', $data)->setPaper('a4', 'portrait');

        return $pdf->stream("statement_of_account_{$payrollRecord->employee_id}_{$payrollRecord->period_start?->format('Ymd')}.pdf");
    }

    /**
     * Stream date range batch payroll summary PDF
     */
    public function downloadSummaryPdf(Request $request)
    {
        $validated = $request->validate([
            'period_start' => 'required|date',
            'period_end'   => 'required|date|after_or_equal:period_start',
            'status'       => 'nullable|string|in:all,draft,pending,paid',
        ]);

        $start = Carbon::parse($validated['period_start']);
        $end = Carbon::parse($validated['period_end']);
        $statusFilter = strtolower($validated['status'] ?? 'all');

        // Check if saved payroll records exist in database
        $query = Payroll::with('employee')
            ->whereDate('period_start', '>=', $start)
            ->whereDate('period_end', '<=', $end);

        if ($statusFilter !== 'all') {
            $query->where('status', $statusFilter);
        }

        $savedPayrolls = $query->orderBy('payroll_date')->get();

        if ($savedPayrolls->count() > 0) {
            $payrollsList = $savedPayrolls->map(function ($p) {
                $emp = $p->employee;
                return [
                    'name'                      => $emp?->name ?? 'N/A',
                    'position'                  => $emp?->position ?? 'Encoder',
                    'daily_rate'                => (float) ($emp?->daily_rate ?? ($p->hourly_rate * 8)),
                    'days_worked'               => (int) $p->days_worked,
                    'gross_earnings'            => (float) $p->basic_pay,
                    'cash_advance_payout'        => (float) (($p->cash_advance_payout ?? 0) > 0 ? $p->cash_advance_payout : Advancement::where('payout_payroll_id', $p->id)->sum('amount')),
                    'total_earnings'            => (float) $p->gross_pay,
                    'cash_advance_deduction'     => (float) (($p->cash_advance_deduction ?? 0) > 0 ? $p->cash_advance_deduction : Advancement::where('deduction_payroll_id', $p->id)->sum('amount')),
                    'pagibig_contribution'      => (float) ($emp?->pagibig_contribution ?? 200),
                    'sss_contribution'          => (float) (($p->sss_loan > 0 ? $p->sss_loan : null) ?? $emp?->sss_contribution ?? 0),
                    'philhealth_contribution'    => (float) ($emp?->philhealth_contribution ?? 0),
                    'withholding_tax'           => (float) ($emp?->withholding_tax ?? 0),
                    'sss_loan'                  => (float) ($p->sss_loan ?? $emp?->sss_contribution ?? $emp?->sss_loan ?? 0),
                    'pagibig_loan'              => (float) ($p->pagibig_loan ?? $emp?->pagibig_loan ?? 0),
                    'emergency_loan'            => (float) ($p->emergency_loan ?? $emp?->emergency_loan ?? 0),
                    'total_deductions'          => (float) $p->deductions,
                    'net_amount'                => (float) $p->net_pay,
                    'status'                    => $p->status,
                ];
            })->toArray();
        } else {
            // Pre-payroll audit preview fallback
            $auditData = $this->auditService->auditBatch($start, $end);
            $payrollsList = $auditData['ready'];
            if ($statusFilter !== 'all') {
                $payrollsList = array_values(array_filter($payrollsList, fn($item) => ($item['status'] ?? 'draft') === $statusFilter));
            }
        }

        $totals = [
            'total_days_worked'        => array_sum(array_column($payrollsList, 'days_worked')),
            'total_basic'              => array_sum(array_column($payrollsList, 'gross_earnings')),
            'total_overtime'           => array_sum(array_column($payrollsList, 'overtime_pay')),
            'total_gross'              => array_sum(array_column($payrollsList, 'total_earnings')),
            'total_pagibig_contrib'    => array_sum(array_column($payrollsList, 'pagibig_contribution')),
            'total_sss_contrib'        => array_sum(array_column($payrollsList, 'sss_contribution')),
            'total_philhealth_contrib' => array_sum(array_column($payrollsList, 'philhealth_contribution')),
            'total_tax'                => array_sum(array_column($payrollsList, 'withholding_tax')),
            'total_sss_loan'           => array_sum(array_column($payrollsList, 'sss_loan')),
            'total_pagibig_loan'       => array_sum(array_column($payrollsList, 'pagibig_loan')),
            'total_emergency_loan'     => array_sum(array_column($payrollsList, 'emergency_loan')),
            'total_deductions'         => array_sum(array_column($payrollsList, 'total_deductions')),
            'total_net'                => array_sum(array_column($payrollsList, 'net_amount')),
        ];

        $pdf = Pdf::loadView('pdfs.payroll_summary', [
            'payrolls' => $payrollsList,
            'periodStart' => $start->toDateString(),
            'periodEnd' => $end->toDateString(),
            'statusFilter' => strtoupper($statusFilter),
            'totals' => $totals,
        ])->setPaper('a4', 'landscape');

        return $pdf->stream("payroll_summary_{$statusFilter}_{$start->format('Ymd')}_to_{$end->format('Ymd')}.pdf");
    }

    /**
     * Preview payroll details based on an attendance file (legacy endpoint)
     */
    public function preview(PreviewPayrollRequest $request)
    {
        try {
            $validated = $request->validated();

            $import = new AttendanceImport(persist: false);
            Excel::import($import, $validated['attendance_file']);

            if ($import->importedCount === 0) {
                throw ValidationException::withMessages([
                    'attendance_file' => 'No attendance records were imported from the file.',
                ]);
            }

            [$periodStart, $periodEnd] = $this->resolvePeriodRange($import);
            $employee = $import->employee;
            $hourlyRate = (float) ($employee?->hourly_rate ?? 0);

            $summary = $this->payrollService->calculateSimplePayroll(
                hourlyRate: $hourlyRate,
                totalHours: $import->totalHours,
                holidays: (int) $validated['holidays'],
                deductions: (float) $validated['deductions'],
            );

            return response()->json([
                'employee' => [
                    'id' => $employee?->id,
                    'employee_code' => $import->employeeCode,
                    'name' => $employee?->name ?? $import->employeeName,
                    'position' => $employee?->position,
                    'hourly_rate' => $employee?->hourly_rate,
                ],
                'period' => [
                    'start' => $periodStart?->toDateString(),
                    'end' => $periodEnd?->toDateString(),
                    'days_worked' => $import->importedCount,
                    'total_hours' => $import->totalHours,
                ],
                'summary' => $summary,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to calculate payroll preview',
                'error' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Generate payroll for single attendance file (legacy endpoint)
     */
    public function generate(GeneratePayrollRequest $request)
    {
        $validated = $request->validated();

        $import = new AttendanceImport(persist: true);
        Excel::import($import, $validated['attendance_file']);

        if ($import->importedCount === 0) {
            throw ValidationException::withMessages([
                'attendance_file' => 'No attendance records were imported from the file.',
            ]);
        }

        [$periodStart, $periodEnd] = $this->resolvePeriodRange($import);
        $employee = $import->employee;
        $hourlyRate = (float) ($employee?->hourly_rate ?? 0);

        $summary = $this->payrollService->calculateSimplePayroll(
            hourlyRate: $hourlyRate,
            totalHours: $import->totalHours,
            holidays: (int) $validated['holidays'],
            deductions: (float) $validated['deductions'],
        );

        $payroll = Payroll::create([
            'employee_id'  => $employee?->id,
            'period_start' => $periodStart?->toDateString(),
            'period_end'   => $periodEnd?->toDateString(),
            'payroll_date' => $periodEnd?->toDateString(),
            'days_worked'  => $import->importedCount,
            'total_days'   => $import->importedCount,
            'total_hours'  => $import->totalHours,
            'hours_worked' => $import->totalHours,
            'hourly_rate'  => $hourlyRate,
            'basic_pay'    => $summary['basic_pay'],
            'holidays'     => (int) $validated['holidays'],
            'gross_pay'    => $summary['gross_pay'],
            'deductions'   => (float) $validated['deductions'],
            'net_pay'      => $summary['net_pay'],
            'status'       => 'draft',
        ]);

        return redirect()->route('payroll.index')
            ->with('success', 'Payroll created successfully for employee: ' . ($employee?->name ?? 'N/A'));
    }

    /**
     * Update the status of a payroll record.
     */
    public function updateStatus(Request $request, Payroll $payroll)
    {
        $validated = $request->validate([
            'status' => 'required|in:draft,pending,paid',
        ]);

        $oldStatus = $payroll->status;
        $newStatus = $validated['status'];

        if ($oldStatus === 'paid' && $newStatus !== 'paid') {
            throw ValidationException::withMessages([
                'status' => 'Finalized "paid" payroll records cannot be reverted back to draft or pending status to protect financial audit integrity.',
            ]);
        }

        $payroll->update([
            'status' => $newStatus,
        ]);

        $this->syncAdvancementStatusForPayroll($payroll, $oldStatus, $newStatus);

        return redirect()->back()->with('success', 'Payroll status updated successfully.');
    }

    private function resolvePeriodRange(AttendanceImport $import): array
    {
        if ($import->attendanceRows === []) {
            return [null, null];
        }

        $periodStart = null;
        $periodEnd = null;

        foreach ($import->attendanceRows as $row) {
            $date = CarbonImmutable::parse($row['date']);
            if (!$periodStart || $date->lt($periodStart)) {
                $periodStart = $date;
            }
            if (!$periodEnd || $date->gt($periodEnd)) {
                $periodEnd = $date;
            }
        }

        return [$periodStart, $periodEnd];
    }

    public function get()
    {
        return Payroll::with('employee:id,name')->latest('period_end')->get();
    }

    public function header()
    {
        return response()->json(Schema::getColumnListing('payrolls'));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'period_start' => 'required|date',
            'period_end' => 'required|date|after_or_equal:period_start',
            'basic_pay' => 'required|numeric',
            'holidays' => 'required|integer|min:0',
            'gross_pay' => 'required|numeric',
            'deductions' => 'required|numeric|min:0',
            'net_pay' => 'required|numeric',
            'status' => 'required|in:draft,pending,paid',
        ]);

        $payroll = Payroll::create($validated);

        return response()->json([
            'message' => 'Payroll created successfully!',
            'data' => $payroll
        ], 201);
    }

    public function show($id)
    {
        $payroll = Payroll::with('employee:id,name,employee_code,position,daily_rate,hourly_rate,base_salary,sss_contribution,pagibig_contribution,philhealth_contribution,emergency_loan,withholding_tax,tin,sss_no,pagibig_no,philhealth_no,contact_number,address')->findOrFail($id);

        $attendanceRecords = [];
        if ($payroll->employee && $payroll->period_start && $payroll->period_end) {
            $attendanceRecords = $payroll->employee
                ->attendances()
                ->whereBetween('date', [
                    $payroll->period_start->toDateString(),
                    $payroll->period_end->toDateString(),
                ])
                ->orderBy('date')
                ->get()
                ->map(function ($attendance) use ($payroll) {
                    return [
                        'id' => $attendance->id,
                        'employee_id' => $attendance->employee_id,
                        'employee_name' => $payroll->employee?->name,
                        'date' => $attendance->date,
                        'week' => $attendance->week,
                        'time_in' => $attendance->time_in,
                        'time_out' => $attendance->time_out,
                        'times' => $attendance->times,
                        'working_time' => $attendance->working_time,
                    ];
                })
                ->values();
        }

        return Inertia::render('Payroll/Show', [
            'payroll' => [
                'id'                     => $payroll->id,
                'employee_id'            => $payroll->employee_id,
                'employee_name'          => $payroll->employee?->name,
                'employee'               => $payroll->employee ? [
                    'id'                      => $payroll->employee->id,
                    'name'                    => $payroll->employee->name,
                    'employee_code'           => $payroll->employee->employee_code,
                    'position'                => $payroll->employee->position,
                    'daily_rate'              => (float) ($payroll->employee->daily_rate ?? 0),
                    'hourly_rate'             => (float) ($payroll->hourly_rate ?? 0),
                    'sss_contribution'        => (float) ($payroll->employee->sss_contribution ?? 0),
                    'pagibig_contribution'    => (float) ($payroll->employee->pagibig_contribution ?? 0),
                    'philhealth_contribution' => (float) ($payroll->employee->philhealth_contribution ?? 0),
                    'emergency_loan'          => (float) ($payroll->employee->emergency_loan ?? 0),
                    'withholding_tax'         => (float) ($payroll->employee->withholding_tax ?? 0),
                    'attendances'             => $attendanceRecords,
                ] : null,
                'period_start'           => $payroll->period_start?->toDateString(),
                'period_end'             => $payroll->period_end?->toDateString(),
                'payroll_date'           => $payroll->payroll_date?->toDateString(),
                'days_worked'            => $payroll->days_worked,
                'total_days'             => $payroll->total_days,
                'total_hours'            => $payroll->total_hours,
                'hours_worked'           => $payroll->hours_worked,
                'hourly_rate'            => $payroll->hourly_rate,
                'basic_pay'              => (float) $payroll->basic_pay,
                'overtime_pay'           => (float) ($payroll->overtime_pay ?? max(0, (float) $payroll->gross_pay - (float) $payroll->basic_pay - (float) (($payroll->cash_advance_payout ?? 0) > 0 ? $payroll->cash_advance_payout : Advancement::where('payout_payroll_id', $payroll->id)->sum('amount')))),
                'overtime_hours'         => (float) ($payroll->overtime_hours ?? 0),
                'holidays'               => $payroll->holidays,
                'holiday_pay'            => (float) ($payroll->holiday_pay ?? round((float) ($payroll->employee?->daily_rate ?? 0) * (int) $payroll->holidays, 2)),
                'gross_pay'              => (float) $payroll->gross_pay,
                'cash_advance_payout'    => (float) (($payroll->cash_advance_payout ?? 0) > 0 ? $payroll->cash_advance_payout : Advancement::where('payout_payroll_id', $payroll->id)->sum('amount')),
                'cash_advance_deduction' => (float) (($payroll->cash_advance_deduction ?? 0) > 0 ? $payroll->cash_advance_deduction : Advancement::where('deduction_payroll_id', $payroll->id)->sum('amount')),
                'sss_loan'               => (float) ($payroll->sss_loan ?? $payroll->employee?->sss_loan ?? 0),
                'pagibig_loan'           => (float) ($payroll->pagibig_loan ?? $payroll->employee?->pagibig_loan ?? 0),
                'emergency_loan'         => (float) ($payroll->emergency_loan ?? $payroll->employee?->emergency_loan ?? 0),
                'deductions'             => (float) $payroll->deductions,
                'net_pay'                => (float) $payroll->net_pay,
                'status'                 => $payroll->status,
                'created_at'             => $payroll->created_at?->toDateTimeString(),
                'updated_at'             => $payroll->updated_at?->toDateTimeString(),
            ],
        ]);
    }

    /**
     * Delete a payroll record and safely revert any linked cash advance statuses.
     */
    public function destroy($id)
    {
        $payroll = Payroll::findOrFail($id);

        // Safely release linked cash advance payouts and deductions
        Advancement::where('payout_payroll_id', $payroll->id)
            ->orWhere('deduction_payroll_id', $payroll->id)
            ->get()
            ->each(fn(Advancement $adv) => $adv->releaseFromPayroll($payroll->id));

        $payroll->delete();

        if (request()->wantsJson() || request()->ajax()) {
            return response()->json([
                'success' => true,
                'message' => 'Payroll record deleted successfully.',
            ]);
        }

        return redirect()->route('payroll.index')->with('success', 'Payroll record deleted successfully.');
    }

    public function bulkUpdate(Request $request)
    {
        return $this->performBulkUpdate(
            $request,
            Payroll::class,
            ['status' => 'required|in:draft,pending,paid'],
            function (Payroll $payroll, array $payload): array {
                if (isset($payload['status'])) {
                    $oldStatus = $payroll->status;
                    $newStatus = $payload['status'];

                    if ($oldStatus === 'paid' && $newStatus !== 'paid') {
                        throw ValidationException::withMessages([
                            'status' => "Payroll #{$payroll->id} is already finalized ('paid') and cannot be reverted back to '{$newStatus}'.",
                        ]);
                    }

                    $this->syncAdvancementStatusForPayroll($payroll, $oldStatus, $newStatus);
                }
                return $payload;
            },
            successLabel: 'payroll',
        );
    }

    /**
     * Bulk destroy payroll records and safely release any linked cash advance statuses.
     */
    public function bulkDestroy(Request $request)
    {
        $validated = $request->validate([
            'ids'   => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'distinct', 'exists:payrolls,id'],
        ]);

        $payrolls = Payroll::whereIn('id', $validated['ids'])->get();

        foreach ($payrolls as $payroll) {
            // Safely release linked cash advance payouts and deductions
            Advancement::where('payout_payroll_id', $payroll->id)
                ->orWhere('deduction_payroll_id', $payroll->id)
                ->get()
                ->each(fn(Advancement $adv) => $adv->releaseFromPayroll($payroll->id));

            $payroll->delete();
        }

        $count = count($payrolls);
        $msg = "Successfully deleted {$count} payroll " . ($count === 1 ? 'record' : 'records') . '.';

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json([
                'success' => true,
                'message' => $msg,
            ]);
        }

        return redirect()->back()->with('success', $msg);
    }

    /**
     * Synchronize cash advancement lifecycle states based on payroll status transitions.
     */
    private function syncAdvancementStatusForPayroll(Payroll $payroll, string $oldStatus, string $newStatus): void
    {
        if ($oldStatus === $newStatus) {
            return;
        }

        // When status becomes 'paid' -> commit payout and repayment deductions
        if ($newStatus === 'paid') {
            Advancement::where('payout_payroll_id', $payroll->id)
                ->where('status', 'pending_payout')
                ->update(['status' => 'paid_out']);

            $deductionPool = (float) ($payroll->cash_advance_deduction ?? 0);
            if ($deductionPool > 0) {
                $repayables = Advancement::where('employee_id', $payroll->employee_id)
                    ->whereIn('status', ['paid_out', 'partially_deducted'])
                    ->where('remaining_balance', '>', 0)
                    ->orderBy('advancement_date', 'asc')
                    ->get();

                foreach ($repayables as $adv) {
                    if ($deductionPool <= 0) break;
                    $rem = (float) $adv->remaining_balance;
                    $installmentCap = ($adv->installment_amount && (float) $adv->installment_amount > 0)
                        ? (float) $adv->installment_amount
                        : $rem;
                    $maxForThisAdv = min($rem, $installmentCap);
                    $deductNow = min($maxForThisAdv, $deductionPool);
                    $newRem = round($rem - $deductNow, 2);
                    $deductionPool = round($deductionPool - $deductNow, 2);

                    $adv->update([
                        'remaining_balance' => $newRem,
                        'status' => $newRem <= 0 ? 'deducted' : 'partially_deducted',
                        'deduction_payroll_id' => $payroll->id,
                    ]);

                    // Record exact deduction amount in ledger table
                    AdvancementDeduction::updateOrCreate([
                        'advancement_id' => $adv->id,
                        'payroll_id' => $payroll->id,
                    ], [
                        'amount_deducted' => $deductNow,
                    ]);
                }
            }
        }

        // When moving from 'paid' back to 'draft' or 'pending' -> revert exact committed deduction balance
        if ($oldStatus === 'paid' && in_array($newStatus, ['draft', 'pending'], true)) {
            $deductionRecords = AdvancementDeduction::where('payroll_id', $payroll->id)->get();

            if ($deductionRecords->isNotEmpty()) {
                foreach ($deductionRecords as $record) {
                    $adv = Advancement::find($record->advancement_id);
                    if ($adv) {
                        $deductedAmount = (float) $record->amount_deducted;
                        $revertedBal = min((float) $adv->amount, round((float) $adv->remaining_balance + $deductedAmount, 2));

                        $adv->update([
                            'remaining_balance' => $revertedBal,
                            'status' => $revertedBal >= (float) $adv->amount
                                ? (!empty($adv->payout_payroll_id) ? 'paid_out' : 'pending_payout')
                                : 'partially_deducted',
                            'deduction_payroll_id' => null,
                        ]);
                    }
                    $record->delete();
                }
            } else {
                // Fallback for historic records prior to ledger migration
                Advancement::where('deduction_payroll_id', $payroll->id)->get()->each(function (Advancement $adv) use ($payroll) {
                    $revertedBal = round((float) $adv->remaining_balance + (float) ($payroll->cash_advance_deduction ?? 0), 2);
                    $adv->update([
                        'remaining_balance' => min((float) $adv->amount, $revertedBal),
                        'status' => !empty($adv->payout_payroll_id) ? 'paid_out' : 'pending_payout',
                        'deduction_payroll_id' => null,
                    ]);
                });
            }
        }
    }
}
