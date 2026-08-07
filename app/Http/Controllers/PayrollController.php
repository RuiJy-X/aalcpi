<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Concerns\HandlesBulkUpdates;
use App\Http\Requests\GeneratePayrollRequest;
use App\Http\Requests\PreviewPayrollRequest;
use App\Models\Payroll;
use App\Models\Employee;
use App\Models\Attendance;
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
        $payrolls = Payroll::with('employee:id,name,employee_code,position,daily_rate,sss_loan,pagibig_loan,emergency_loan')
            ->latest('period_end')
            ->get()
            ->map(function (Payroll $record) {
                return [
                    'id' => $record->id,
                    'employee_id' => $record->employee_id,
                    'employee_code' => $record->employee?->employee_code ?? ('EMP-' . str_pad((string) $record->employee_id, 3, '0', STR_PAD_LEFT)),
                    'employee_name' => $record->employee?->name,
                    'position' => $record->employee?->position ?? 'Encoder',
                    'daily_rate' => $record->employee?->daily_rate ?? 0,
                    'period_start' => $record->period_start?->toDateString(),
                    'period_end' => $record->period_end?->toDateString(),
                    'payroll_date' => $record->payroll_date?->toDateString(),
                    'days_worked' => $record->days_worked,
                    'total_days' => $record->total_days,
                    'total_hours' => $record->total_hours,
                    'hours_worked' => $record->hours_worked,
                    'hourly_rate' => $record->hourly_rate,
                    'basic_pay' => $record->basic_pay,
                    'holidays' => $record->holidays,
                    'gross_pay' => $record->gross_pay,
                    'sss_loan' => $record->employee?->sss_loan ?? 0,
                    'pagibig_loan' => $record->employee?->pagibig_loan ?? 0,
                    'emergency_loan' => $record->employee?->emergency_loan ?? 0,
                    'deductions' => $record->deductions,
                    'net_pay' => $record->net_pay,
                    'status' => $record->status,
                    'created_at' => $record->created_at,
                    'updated_at' => $record->updated_at,
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
        // Default range: 1st - 15th of current month
        $start = Carbon::now()->startOfMonth();
        $end = Carbon::now()->startOfMonth()->addDays(14);

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
     * Import attendance Excel file directly on the batch generation page
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
            Excel::import($import, $request->file('attendance_file'));

            $start = Carbon::parse($validated['period_start']);
            $end = Carbon::parse($validated['period_end']);

            $batchData = $this->auditService->auditBatch($start, $end);

            return response()->json([
                'success' => true,
                'message' => 'Attendance data imported successfully!',
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
            'daily_rate'            => 'required|numeric|min:0',
            'sss_loan'              => 'nullable|numeric|min:0',
            'pagibig_loan'          => 'nullable|numeric|min:0',
            'emergency_loan'        => 'nullable|numeric|min:0',
            'pagibig_contribution'  => 'nullable|numeric|min:0',
            'sss_contribution'      => 'nullable|numeric|min:0',
            'philhealth_contribution' => 'nullable|numeric|min:0',
            'withholding_tax'       => 'nullable|numeric|min:0',
            'period_start'          => 'required|date',
            'period_end'            => 'required|date|after_or_equal:period_start',
        ]);

        $hoursPerDay = 8;
        $daysPerMonth = 24;

        $dailyRate = (float) $validated['daily_rate'];
        $validated['hourly_rate'] = number_format($dailyRate / $hoursPerDay, 2, '.', '');
        $validated['base_salary'] = number_format($dailyRate * $daysPerMonth, 2, '.', '');

        $employee->update($validated);

        $start = Carbon::parse($validated['period_start']);
        $end = Carbon::parse($validated['period_end']);

        $batchData = $this->auditService->auditBatch($start, $end);

        return response()->json([
            'success' => true,
            'message' => "Updated profile setup for {$employee->name}.",
            'batchData' => $batchData,
        ]);
    }

    /**
     * Process and save batch payroll records
     */
    public function processBatch(Request $request)
    {
        $validated = $request->validate([
            'period_start' => 'required|date',
            'period_end'   => 'required|date|after_or_equal:period_start',
            'employee_ids' => 'nullable|array',
            'employee_ids.*' => 'exists:employees,id',
        ]);

        $start = Carbon::parse($validated['period_start']);
        $end = Carbon::parse($validated['period_end']);

        $auditData = $this->auditService->auditBatch($start, $end);
        $readyEmployees = $auditData['ready'];

        if (empty($readyEmployees)) {
            throw ValidationException::withMessages([
                'period_start' => 'No ready employees available to process for this date range.',
            ]);
        }

        $allowedIds = isset($validated['employee_ids']) ? array_map('intval', $validated['employee_ids']) : null;

        $savedCount = 0;
        foreach ($readyEmployees as $empData) {
            if ($allowedIds !== null && !in_array($empData['employee_id'], $allowedIds, true)) {
                continue;
            }

            Payroll::updateOrCreate([
                'employee_id'  => $empData['employee_id'],
                'period_start' => $start->toDateString(),
                'period_end'   => $end->toDateString(),
            ], [
                'payroll_date'  => $end->toDateString(),
                'days_worked'   => $empData['days_worked'],
                'total_days'    => $empData['days_worked'],
                'total_hours'   => $empData['hours_worked'],
                'hours_worked'  => $empData['hours_worked'],
                'hourly_rate'   => $empData['hourly_rate'],
                'basic_pay'     => $empData['gross_earnings'],
                'holidays'       => 0,
                'gross_pay'     => $empData['total_earnings'],
                'deductions'    => $empData['total_deductions'],
                'net_pay'       => $empData['net_amount'],
                'status'        => 'draft',
            ]);

            $savedCount++;
        }

        return redirect()->route('payroll.index')->with('success', "Successfully generated payroll batch for {$savedCount} employees!");
    }

    /**
     * Stream individual employee payslip PDF
     */
    public function downloadPayslipPdf($id)
    {
        $payrollRecord = Payroll::with('employee')->findOrFail($id);
        $employee = $payrollRecord->employee;

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
            'overtime_pay'           => max(0, (float) $payrollRecord->gross_pay - (float) $payrollRecord->basic_pay),
            'gross_pay'              => (float) $payrollRecord->gross_pay,
            'sss_loan'               => (float) ($employee?->sss_loan ?? 0),
            'pagibig_loan'           => (float) ($employee?->pagibig_loan ?? 0),
            'emergency_loan'         => (float) ($employee?->emergency_loan ?? 0),
            'pagibig_contribution'   => (float) ($employee?->pagibig_contribution ?? 200.00),
            'sss_contribution'       => (float) ($employee?->sss_contribution ?? 0),
            'philhealth_contribution' => (float) ($employee?->philhealth_contribution ?? 0),
            'withholding_tax'        => (float) ($employee?->withholding_tax ?? 0),
            'deductions'             => (float) $payrollRecord->deductions,
            'net_pay'                => (float) $payrollRecord->net_pay,
        ];

        $pdf = Pdf::loadView('pdfs.employee_payslip', compact('payroll'))->setPaper('a5', 'portrait');

        return $pdf->stream("payslip_{$payrollRecord->employee_id}_{$payroll['period_start']}.pdf");
    }

    /**
     * Stream date range batch payroll summary PDF
     */
    public function downloadSummaryPdf(Request $request)
    {
        $validated = $request->validate([
            'period_start' => 'required|date',
            'period_end'   => 'required|date|after_or_equal:period_start',
        ]);

        $start = Carbon::parse($validated['period_start']);
        $end = Carbon::parse($validated['period_end']);

        $auditData = $this->auditService->auditBatch($start, $end);
        $readyList = $auditData['ready'];

        $totals = [
            'total_days_worked'        => array_sum(array_column($readyList, 'days_worked')),
            'total_basic'              => array_sum(array_column($readyList, 'gross_earnings')),
            'total_overtime'           => array_sum(array_column($readyList, 'overtime_pay')),
            'total_gross'              => array_sum(array_column($readyList, 'total_earnings')),
            'total_pagibig_contrib'    => array_sum(array_column($readyList, 'pagibig_contribution')),
            'total_sss_contrib'        => array_sum(array_column($readyList, 'sss_contribution')),
            'total_philhealth_contrib' => array_sum(array_column($readyList, 'philhealth_contribution')),
            'total_tax'                => array_sum(array_column($readyList, 'withholding_tax')),
            'total_sss_loan'           => array_sum(array_column($readyList, 'sss_loan')),
            'total_pagibig_loan'       => array_sum(array_column($readyList, 'pagibig_loan')),
            'total_emergency_loan'     => array_sum(array_column($readyList, 'emergency_loan')),
            'total_deductions'         => array_sum(array_column($readyList, 'total_deductions')),
            'total_net'                => array_sum(array_column($readyList, 'net_amount')),
        ];

        $pdf = Pdf::loadView('pdfs.payroll_summary', [
            'payrolls' => $readyList,
            'periodStart' => $start->toDateString(),
            'periodEnd' => $end->toDateString(),
            'totals' => $totals,
        ])->setPaper('a4', 'landscape');

        return $pdf->stream("payroll_summary_{$start->format('Ymd')}_to_{$end->format('Ymd')}.pdf");
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
                    'base_salary' => $employee?->base_salary,
                    'exists' => (bool) $employee,
                ],
                'period_start' => $periodStart?->toDateString(),
                'period_end' => $periodEnd?->toDateString(),
                'attendance' => [
                    'rows' => $import->attendanceRows,
                    'total_hours' => round($import->totalHours, 2),
                    'total_days' => $import->totalDays,
                ],
                'payroll' => [
                    'basic_pay' => $summary['basic_pay'],
                    'holiday_pay' => $summary['holiday_pay'],
                    'gross_pay' => $summary['gross_pay'],
                    'deductions' => (float) $validated['deductions'],
                    'net_pay' => $summary['net_pay'],
                ],
            ]);
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            throw ValidationException::withMessages([
                'attendance_file' => 'Error previewing payroll: ' . $e->getMessage(),
            ]);
        }
    }

    /**
     * Generate payroll for an employee (legacy endpoint)
     */
    public function generate(GeneratePayrollRequest $request)
    {
        try {
            $validated = $request->validated();
            $employeeData = [
                'name' => $validated['employee_name'],
                'position' => $validated['position'] ?? null,
                'hourly_rate' => (float) $validated['hourly_rate'],
                'base_salary' => isset($validated['base_salary']) ? (float) $validated['base_salary'] : null,
            ];

            $import = new AttendanceImport(persist: true, employeeData: $employeeData);
            Excel::import($import, $validated['attendance_file']);

            if ($import->importedCount === 0) {
                throw ValidationException::withMessages([
                    'attendance_file' => 'No attendance records were imported from the file.',
                ]);
            }

            $employee = $import->employee;
            if (!$employee) {
                throw ValidationException::withMessages([
                    'attendance_file' => 'Employee could not be resolved from the attendance file.',
                ]);
            }

            [$periodStart, $periodEnd] = $this->resolvePeriodRange($import);

            if (!$periodStart || !$periodEnd) {
                throw ValidationException::withMessages([
                    'attendance_file' => 'Unable to determine payroll period from the attendance file.',
                ]);
            }

            $payroll = $this->payrollService->generatePayroll(
                employee: $employee,
                periodStart: Carbon::parse($periodStart),
                periodEnd: Carbon::parse($periodEnd),
                holidays: (int) $validated['holidays'],
                deductions: (float) $validated['deductions'],
                totalHours: $import->totalHours,
                totalDays: $import->totalDays,
            );

            if ($payroll->payroll_date === null) {
                $payroll->update([
                    'payroll_date' => $payroll->period_end,
                ]);
            }

            return back()->with('success', "Payroll generated successfully for {$employee->name}.");
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            throw ValidationException::withMessages([
                'attendance_file' => 'Error generating payroll: ' . $e->getMessage(),
            ]);
        }
    }

    /**
     * @return array{0: CarbonImmutable|null, 1: CarbonImmutable|null}
     */
    private function resolvePeriodRange(AttendanceImport $import): array
    {
        if ($import->periodStart && $import->periodEnd) {
            return [$import->periodStart, $import->periodEnd];
        }

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
        $payroll = Payroll::with('employee:id,name,position,hourly_rate,base_salary')->findOrFail($id);

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
                'id' => $payroll->id,
                'employee_id' => $payroll->employee_id,
                'employee_name' => $payroll->employee?->name,
                'employee' => $payroll->employee ? [
                    'id' => $payroll->employee->id,
                    'name' => $payroll->employee->name,
                    'position' => $payroll->employee->position,
                    'hourly_rate' => $payroll->hourly_rate,
                    'base_salary' => $payroll->employee->base_salary,
                    'attendances' => $attendanceRecords,
                ] : null,
                'period_start' => $payroll->period_start?->toDateString(),
                'period_end' => $payroll->period_end?->toDateString(),
                'payroll_date' => $payroll->payroll_date?->toDateString(),
                'days_worked' => $payroll->days_worked,
                'total_days' => $payroll->total_days,
                'total_hours' => $payroll->total_hours,
                'hours_worked' => $payroll->hours_worked,
                'hourly_rate' => $payroll->hourly_rate,
                'basic_pay' => $payroll->basic_pay,
                'holidays' => $payroll->holidays,
                'gross_pay' => $payroll->gross_pay,
                'deductions' => $payroll->deductions,
                'net_pay' => $payroll->net_pay,
                'status' => $payroll->status,
                'created_at' => $payroll->created_at?->toDateTimeString(),
                'updated_at' => $payroll->updated_at?->toDateTimeString(),
            ],
        ]);
    }

    public function bulkUpdate(Request $request)
    {
        return $this->performBulkUpdate(
            $request,
            Payroll::class,
            [
                'status' => ['required', 'string', 'in:draft,pending,paid'],
            ],
            successLabel: 'payroll record',
        );
    }

    public function update(Request $request, Payroll $payroll)
    {
        $validated = $request->validate([
            'status' => 'sometimes|in:draft,pending,paid',
            'payroll_date' => 'sometimes|date',
            'holidays' => 'sometimes|integer|min:0',
            'deductions' => 'sometimes|numeric|min:0',
            'net_pay' => 'sometimes|numeric',
        ]);

        $payroll->update($validated);

        return back()->with('success', 'Payroll updated successfully!');
    }

    public function updateStatus(Request $request, Payroll $payroll)
    {
        $validated = $request->validate([
            'status' => 'required|in:draft,pending,paid',
        ]);
        $payroll->update([
            'status' => $validated['status'],
        ]);

        return back()->with('success', 'Payroll status updated successfully!');
    }

    public function destroy($id)
    {
        $payroll = Payroll::findOrFail($id);
        $payroll->delete();
        return back()->with('success', 'Payroll record deleted successfully!');
    }

    public function bulkDestroy(Request $request)
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'distinct', 'exists:payrolls,id'],
        ]);

        Payroll::whereIn('id', $validated['ids'])->delete();

        return redirect()
            ->back()
            ->with('success', 'Selected payroll records deleted successfully.');
    }
}
