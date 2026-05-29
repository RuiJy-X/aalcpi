<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\GeneratePayrollRequest;
use App\Http\Requests\PreviewPayrollRequest;
use App\Models\Payroll;
use App\Models\Attendance;
use App\Imports\AttendanceImport;
use App\Services\PayrollCalculationService;
use Carbon\Carbon;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

class PayrollController extends Controller
{
    protected PayrollCalculationService $payrollService;

    public function __construct(PayrollCalculationService $payrollService)
    {
        $this->payrollService = $payrollService;
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $payrolls = Payroll::with('employee:id,name')
            ->latest('period_end')
            ->get()
            ->map(function (Payroll $record) {
                return [
                    'id' => $record->id,
                    'employee_id' => $record->employee_id,
                    'employee_name' => $record->employee?->name,
                    'period_start' => $record->period_start,
                    'period_end' => $record->period_end,
                    'payroll_date' => $record->payroll_date,
                    'days_worked' => $record->days_worked,
                    'total_days' => $record->total_days,
                    'total_hours' => $record->total_hours,
                    'hours_worked' => $record->hours_worked,
                    'hourly_rate' => $record->hourly_rate,
                    'basic_pay' => $record->basic_pay,
                    'holidays' => $record->holidays,
                    'gross_pay' => $record->gross_pay,
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
     * Preview payroll details based on an attendance file
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
                    'department' => $employee?->department,
                    'position' => $employee?->position,
                    'employment_type' => $employee?->employment_type,
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
     * Generate payroll for an employee
     */
    public function generate(GeneratePayrollRequest $request)
    {
        try {
            $validated = $request->validated();
            $employeeData = [
                'name' => $validated['employee_name'],
                'department' => $validated['department'] ?? null,
                'position' => $validated['position'] ?? null,
                'employment_type' => $validated['employment_type'] ?? null,
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

    /**
     */
    public function get()
    {
        return Payroll::with('employee:id,name')->latest('period_end')->get();
    }

    /**
     * Get payroll table schema
     */
    public function header()
    {
        return response()->json(Schema::getColumnListing('payrolls'));
    }

    /**
     * Store a newly created resource in storage.
     */
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

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        $payroll = Payroll::with('employee:id,name,department,position,employment_type,hourly_rate,base_salary')->findOrFail($id);

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
                    'department' => $payroll->employee->department,
                    'position' => $payroll->employee->position,
                    'employment_type' => $payroll->employee->employment_type,
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

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Payroll $payroll)
    {
        $validated = $request->validate([
            'status' => 'sometimes|in:draft,pending,paid',
            'payroll_date' => 'sometimes|date',
            'holidays' => 'sometimes|integer|min:0',
            'deductions' => 'sometimes|numeric|min:0',
            'net_pay' => 'sometimes|numeric',
            'attendance_file' => 'sometimes|file|mimes:xlsx,xls',
        ]);

        $updates = [];

        if (isset($validated['status'])) {
            $updates['status'] = $validated['status'];
        }

        if (array_key_exists('payroll_date', $validated)) {
            $updates['payroll_date'] = $validated['payroll_date'];
        }

        if ($payroll->hourly_rate === null && $payroll->employee?->hourly_rate !== null) {
            $updates['hourly_rate'] = $payroll->employee->hourly_rate;
        }

        $hasAttendanceFile = $request->hasFile('attendance_file');

        if ($hasAttendanceFile || isset($validated['holidays']) || isset($validated['deductions'])) {
            $holidays = isset($validated['holidays'])
                ? (int) $validated['holidays']
                : (int) $payroll->holidays;
            $deductions = isset($validated['deductions'])
                ? (float) $validated['deductions']
                : (float) $payroll->deductions;

            $hourlyRate = (float) ($updates['hourly_rate'] ?? $payroll->hourly_rate ?? $payroll->employee?->hourly_rate ?? 0);
            $totalHours = (float) ($payroll->total_hours ?? $payroll->hours_worked ?? 0);
            $totalDays = (int) ($payroll->total_days ?? $payroll->days_worked ?? 0);
            $periodStart = $payroll->period_start;
            $periodEnd = $payroll->period_end;

            if ($hasAttendanceFile) {
                $preview = new AttendanceImport(persist: false);
                Excel::import($preview, $request->file('attendance_file'));

                if ($preview->importedCount === 0) {
                    throw ValidationException::withMessages([
                        'attendance_file' => 'No attendance records were imported from the file.',
                    ]);
                }

                $employee = $preview->employee;
                if (!$employee || $employee->id !== $payroll->employee_id) {
                    throw ValidationException::withMessages([
                        'attendance_file' => 'The attendance file does not match the payroll employee.',
                    ]);
                }

                [$periodStart, $periodEnd] = $this->resolvePeriodRange($preview);

                if (!$periodStart || !$periodEnd) {
                    throw ValidationException::withMessages([
                        'attendance_file' => 'Unable to determine payroll period from the attendance file.',
                    ]);
                }

                if (
                    $payroll->period_start
                    && $payroll->period_end
                    && (
                        $periodStart->toDateString() !== $payroll->period_start->toDateString()
                        || $periodEnd->toDateString() !== $payroll->period_end->toDateString()
                    )
                ) {
                    throw ValidationException::withMessages([
                        'attendance_file' => 'The attendance file period must match the payroll period.',
                    ]);
                }

                Attendance::query()
                    ->where('employee_id', $payroll->employee_id)
                    ->whereBetween('date', [
                        $periodStart->toDateString(),
                        $periodEnd->toDateString(),
                    ])
                    ->delete();

                $import = new AttendanceImport(persist: true);
                Excel::import($import, $request->file('attendance_file'));

                if ($import->importedCount === 0) {
                    throw ValidationException::withMessages([
                        'attendance_file' => 'No attendance records were imported from the file.',
                    ]);
                }

                $totalHours = $import->totalHours;
                $totalDays = $import->totalDays;
            }

            $summary = $this->payrollService->calculateSimplePayroll(
                hourlyRate: $hourlyRate,
                totalHours: $totalHours,
                holidays: $holidays,
                deductions: $deductions,
            );

            $updates = array_merge($updates, [
                'period_start' => $periodStart,
                'period_end' => $periodEnd,
                'days_worked' => $totalDays,
                'total_days' => $totalDays,
                'total_hours' => $totalHours,
                'hours_worked' => $totalHours,
                'basic_pay' => $summary['basic_pay'],
                'holidays' => $holidays,
                'gross_pay' => $summary['gross_pay'],
                'deductions' => $deductions,
                'net_pay' => $summary['net_pay'],
            ]);
        } elseif (isset($validated['deductions'])) {
            $this->payrollService->updateDeductions($payroll, (float) $validated['deductions']);
        }

        if ($updates !== []) {
            $payroll->update($updates);
        }

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

    /**
     * Remove the specified resource from storage.
     */
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
