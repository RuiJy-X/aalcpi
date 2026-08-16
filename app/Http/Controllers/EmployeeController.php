<?php

namespace App\Http\Controllers;


use Inertia\Inertia;
use App\Http\Controllers\Controller;
use App\Http\Controllers\Concerns\HandlesBulkUpdates;
use App\Models\Attendance;
use App\Models\Employee;
use App\Models\Advancement;
use App\Models\PayrollCalculationSetting;
use App\Models\Payroll;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;

class EmployeeController extends Controller
{
    use HandlesBulkUpdates;


    public function index()
    {
        $employees = Employee::all();
        $settings = PayrollCalculationSetting::query()->first();

        return Inertia::render('Employees/Index', [
            'employees' => $employees,
            'hourlyRateSettings' => [
                'days_per_month' => $settings?->days_per_month ?? 30,
                'hours_per_day' => $settings?->hours_per_day ?? 8,
            ],
        ]);
    }

    public function show($id)
    {
        $employee = Employee::findOrFail($id);
        $settings = PayrollCalculationSetting::query()->first();

        $attendance = $employee->attendances()
            ->latest('date')
            ->get()
            ->map(function (Attendance $record) use ($employee) {
                return [
                    'id' => $record->id,
                    'employee_id' => $record->employee_id,
                    'employee_name' => $employee->name,
                    'date' => $record->date,
                    'week' => $record->week,
                'time_in' => $record->time_in,
                    'time_out' => $record->time_out,
                    'times' => $record->times,
                    'working_time' => $record->working_time,
                ];
            });

        $payrolls = $employee->payrolls()
            ->with('employee')
            ->latest('period_end')
            ->get()
            ->map(function (Payroll $record) use ($employee) {
                return [
                    'id'                     => $record->id,
                    'employee_id'            => $record->employee_id,
                    'employee_code'          => $employee->employee_code ?? ('EMP-' . str_pad((string) $employee->id, 3, '0', STR_PAD_LEFT)),
                    'employee_name'          => $employee->name ?? 'N/A',
                    'position'               => $employee->position ?? 'N/A',
                    'period_start'           => $record->period_start?->toDateString(),
                    'period_end'             => $record->period_end?->toDateString(),
                    'days_worked'            => (int) ($record->days_worked ?? 0),
                    'total_days'             => (int) ($record->total_days ?? 0),
                    'total_hours'            => (float) ($record->total_hours ?? 0),
                    'hours_worked'           => (float) ($record->hours_worked ?? 0),
                    'hourly_rate'            => (float) ($record->hourly_rate ?? 0),
                    'daily_rate'             => (float) ($record->daily_rate ?? $employee->daily_rate ?? 0),
                    'basic_pay'              => (float) ($record->basic_pay ?? 0),
                    'overtime_hours'         => (float) ($record->overtime_hours ?? 0),
                    'overtime_pay'           => (float) ($record->overtime_pay ?? 0),
                    'holidays'               => (int) ($record->holidays ?? 0),
                    'holiday_pay'            => (float) ($record->holiday_pay ?? 0),
                    'cash_advance_payout'    => (float) ($record->cash_advance_payout ?? 0),
                    'cash_advance_deduction' => (float) ($record->cash_advance_deduction ?? 0),
                    'gross_pay'              => (float) ($record->gross_pay ?? 0),
                    'sss_contribution'       => (float) ($record->sss_contribution ?? $employee->sss_contribution ?? 0),
                    'pagibig_contribution'   => (float) ($record->pagibig_contribution ?? $employee->pagibig_contribution ?? 0),
                    'philhealth_contribution' => (float) ($record->philhealth_contribution ?? $employee->philhealth_contribution ?? 0),
                    'emergency_loan'         => (float) ($record->emergency_loan ?? $employee->emergency_loan ?? 0),
                    'withholding_tax'        => (float) ($record->withholding_tax ?? $employee->withholding_tax ?? 0),
                    'deductions'             => (float) ($record->deductions ?? 0),
                    'net_pay'                => (float) ($record->net_pay ?? 0),
                    'status'                 => $record->status,
                    'created_at'             => $record->created_at?->toDateTimeString(),
                    'updated_at'             => $record->updated_at?->toDateTimeString(),
                    'employee'               => [
                        'id'                     => $employee->id,
                        'name'                   => $employee->name,
                        'employee_code'          => $employee->employee_code,
                        'position'               => $employee->position,
                        'daily_rate'             => (float) ($employee->daily_rate ?? 0),
                        'sss_contribution'       => (float) ($employee->sss_contribution ?? 0),
                        'pagibig_contribution'   => (float) ($employee->pagibig_contribution ?? 0),
                        'philhealth_contribution' => (float) ($employee->philhealth_contribution ?? 0),
                        'emergency_loan'         => (float) ($employee->emergency_loan ?? 0),
                        'withholding_tax'        => (float) ($employee->withholding_tax ?? 0),
                    ],
                ];
            });

        $advancements = $employee->advancements()
            ->latest('advancement_date')
            ->get()
            ->map(function ($adv) {
                return [
                    'id' => $adv->id,
                    'amount' => (float) $adv->amount,
                    'remaining_balance' => (float) $adv->remaining_balance,
                    'advancement_date' => $adv->advancement_date?->toDateString(),
                    'status' => $adv->status,
                    'notes' => $adv->notes,
                    'created_at' => $adv->created_at?->toDateTimeString(),
                ];
            });

        return Inertia::render('Employees/Show', [
            'employee' => $employee,
            'attendance' => $attendance,
            'payrolls' => $payrolls,
            'advancements' => $advancements,
            'hourlyRateSettings' => [
                'days_per_month' => $settings?->days_per_month ?? 30,
                'hours_per_day' => $settings?->hours_per_day ?? 8,
            ],
        ]);
    }


    public function create()
    {
        return Inertia::render('Employees/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'                     => 'required|string|max:255',
            'employee_code'            => 'required|string|unique:employees,employee_code',
            'position'                 => 'nullable|string|max:255',
            'daily_rate'               => 'required|numeric|min:0',
            'base_salary'              => 'nullable|numeric|min:0',
            'hourly_rate'              => 'nullable|numeric|min:0',
            'address'                  => 'nullable|string|max:255',
            'tin'                      => 'nullable|string|max:255',
            'sss_no'                   => 'nullable|string|max:255',
            'pagibig_no'               => 'nullable|string|max:255',
            'philhealth_no'            => 'nullable|string|max:255',
            'contact_number'           => 'nullable|string|max:255',
            'sss_contribution'         => 'nullable|numeric|min:0',
            'pagibig_contribution'     => 'nullable|numeric|min:0',
            'philhealth_contribution'   => 'nullable|numeric|min:0',
            'emergency_loan'           => 'nullable|numeric|min:0',
            'withholding_tax'          => 'nullable|numeric|min:0',
        ]);

        $settings = $this->getHourlyRateSettings();
        $daysPerMonth = (int) ($settings['days_per_month'] ?? 30);
        $hoursPerDay = (float) ($settings['hours_per_day'] ?? 8);

        $dailyRate = (float) ($validated['daily_rate'] ?? 0);
        if ($dailyRate > 0) {
            $validated['hourly_rate'] = number_format($dailyRate / $hoursPerDay, 2, '.', '');
            if (empty($validated['base_salary'])) {
                $validated['base_salary'] = number_format($dailyRate * $daysPerMonth, 2, '.', '');
            }
        } elseif (!empty($validated['base_salary'])) {
            $baseSalary = (float) $validated['base_salary'];
            $validated['daily_rate'] = number_format($baseSalary / $daysPerMonth, 2, '.', '');
            $validated['hourly_rate'] = number_format($baseSalary / ($daysPerMonth * $hoursPerDay), 2, '.', '');
        }

        $employee = Employee::create($validated);
        return redirect()->route('employees.index')->with('success', 'Employee profile created successfully!');
    }

    public function show_with_payroll($id)
    {
        return Employee::with('payrolls')->findOrFail($id);
    }

    public function show_with_attendance($id)
    {
        return Employee::with('attendances')->findOrFail($id);
    }

    public function show_with_both($id)
    {
        $employee = Employee::with(['payrolls', 'attendances'])->findOrFail($id);

        return response()->json($employee);
    }

    public function edit($id)
    {
        $employee = Employee::findOrFail($id);

        return Inertia::render('Employees/Edit', [
            'employee' => $employee,
        ]);
    }

    public function update(Request $request, $id)
    {
        $employee = Employee::findOrFail($id);

        $validated = $request->validate([
            'name'                     => 'required|string|max:255',
            'employee_code'            => 'required|string|unique:employees,employee_code,' . $id,
            'position'                 => 'nullable|string|max:255',
            'daily_rate'               => 'required|numeric|min:0',
            'base_salary'              => 'nullable|numeric|min:0',
            'hourly_rate'              => 'nullable|numeric|min:0',
            'address'                  => 'nullable|string|max:255',
            'tin'                      => 'nullable|string|max:255',
            'sss_no'                   => 'nullable|string|max:255',
            'pagibig_no'               => 'nullable|string|max:255',
            'philhealth_no'            => 'nullable|string|max:255',
            'contact_number'           => 'nullable|string|max:255',
            'sss_contribution'         => 'nullable|numeric|min:0',
            'pagibig_contribution'     => 'nullable|numeric|min:0',
            'philhealth_contribution'   => 'nullable|numeric|min:0',
            'emergency_loan'           => 'nullable|numeric|min:0',
            'withholding_tax'          => 'nullable|numeric|min:0',
        ]);

        $settings = $this->getHourlyRateSettings();
        $daysPerMonth = (int) ($settings['days_per_month'] ?? 30);
        $hoursPerDay = (float) ($settings['hours_per_day'] ?? 8);

        $dailyRate = (float) ($validated['daily_rate'] ?? 0);
        if ($dailyRate > 0) {
            $validated['hourly_rate'] = number_format($dailyRate / $hoursPerDay, 2, '.', '');
            if (empty($validated['base_salary'])) {
                $validated['base_salary'] = number_format($dailyRate * $daysPerMonth, 2, '.', '');
            }
        } elseif (!empty($validated['base_salary'])) {
            $baseSalary = (float) $validated['base_salary'];
            $validated['daily_rate'] = number_format($baseSalary / $daysPerMonth, 2, '.', '');
            $validated['hourly_rate'] = number_format($baseSalary / ($daysPerMonth * $hoursPerDay), 2, '.', '');
        }

        $employee->update($validated);
        return redirect()->route('employees.show', $employee->id)->with('success', 'Employee profile updated successfully!');
    }

    public function bulkUpdate(Request $request)
    {
        return $this->performBulkUpdate(
            $request,
            Employee::class,
            [
                'employee_code' => ['sometimes', 'nullable', 'string', 'max:255'],
                'name' => ['sometimes', 'nullable', 'string', 'max:255'],
                'position' => ['sometimes', 'nullable', 'string', 'max:255'],
                'daily_rate' => ['sometimes', 'nullable', 'numeric', 'min:0'],
                'base_salary' => ['sometimes', 'nullable', 'numeric', 'min:0'],
                'hourly_rate' => ['sometimes', 'nullable', 'numeric', 'min:0'],
                'contact_number' => ['sometimes', 'nullable', 'string', 'max:255'],
                'address' => ['sometimes', 'nullable', 'string', 'max:255'],
                'tin' => ['sometimes', 'nullable', 'string', 'max:255'],
                'sss_no' => ['sometimes', 'nullable', 'string', 'max:255'],
                'pagibig_no' => ['sometimes', 'nullable', 'string', 'max:255'],
                'philhealth_no' => ['sometimes', 'nullable', 'string', 'max:255'],
                'sss_contribution' => ['sometimes', 'nullable', 'numeric', 'min:0'],
                'pagibig_contribution' => ['sometimes', 'nullable', 'numeric', 'min:0'],
                'philhealth_contribution' => ['sometimes', 'nullable', 'numeric', 'min:0'],
                'emergency_loan' => ['sometimes', 'nullable', 'numeric', 'min:0'],
                'withholding_tax' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            ],
            function (Employee $employee, array $payload): array {
                $settings = $this->getHourlyRateSettings();
                $hoursPerDay = (float) ($settings['hours_per_day'] ?? 8);
                $daysPerMonth = (int) ($settings['days_per_month'] ?? 30);

                if (array_key_exists('daily_rate', $payload) && $payload['daily_rate'] !== null) {
                    $dailyRate = (float) $payload['daily_rate'];
                    $payload['hourly_rate'] = number_format($dailyRate / $hoursPerDay, 2, '.', '');
                    $payload['base_salary'] = number_format($dailyRate * $daysPerMonth, 2, '.', '');
                } elseif (array_key_exists('base_salary', $payload) && $payload['base_salary'] !== null) {
                    $monthly = (float) $payload['base_salary'];
                    $payload['daily_rate'] = number_format($monthly / $daysPerMonth, 2, '.', '');
                    $payload['hourly_rate'] = number_format($monthly / ($daysPerMonth * $hoursPerDay), 2, '.', '');
                }

                return $payload;
            },
            successLabel: 'employee',
        );
    }

    public function updateHourlyRateSettings(Request $request)
    {
        $validated = $request->validate([
            'days_per_month' => 'required|integer|min:1',
            'hours_per_day' => 'required|numeric|min:0.25',
        ]);

        $settings = PayrollCalculationSetting::query()->first();
        if ($settings) {
            $settings->update($validated);
        } else {
            $settings = PayrollCalculationSetting::create($validated);
        }

        $this->recalculateHourlyRates($settings->days_per_month, $settings->hours_per_day);

        return redirect()->back()->with('success', 'Hourly rate settings updated successfully!');
    }

    private function getHourlyRateSettings(): array
    {
        $settings = PayrollCalculationSetting::query()->first();

        return [
            'days_per_month' => $settings?->days_per_month ?? 30,
            'hours_per_day' => $settings?->hours_per_day ?? 8,
        ];
    }

    private function calculateHourlyRate(float $monthlySalary, array $settings): string
    {
        $daysPerMonth = (int) $settings['days_per_month'];
        $hoursPerDay = (float) $settings['hours_per_day'];

        if ($monthlySalary <= 0 || $daysPerMonth <= 0 || $hoursPerDay <= 0) {
            return '0.00';
        }

        return number_format($monthlySalary / ($daysPerMonth * $hoursPerDay), 2, '.', '');
    }

    private function recalculateHourlyRates(int $daysPerMonth, float $hoursPerDay): void
    {
        Employee::query()
            ->select(['id', 'base_salary'])
            ->chunkById(200, function ($employees) use ($daysPerMonth, $hoursPerDay) {
                foreach ($employees as $employee) {
                    $monthlySalary = (float) ($employee->base_salary ?? 0);
                    $hourlyRate = $monthlySalary > 0 && $daysPerMonth > 0 && $hoursPerDay > 0
                        ? number_format($monthlySalary / ($daysPerMonth * $hoursPerDay), 2, '.', '')
                        : '0.00';

                    Employee::query()
                        ->whereKey($employee->id)
                        ->update(['hourly_rate' => $hourlyRate]);
                }
            });
    }

    public function destroy($id)
    {
        $employee = Employee::findOrFail($id);
        $employee->delete();
        return redirect()->back()->with('success', 'Employee removed successfully!');
    }

    public function bulkDestroy(Request $request)
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'distinct', 'exists:employees,id'],
        ]);

        Employee::whereIn('id', $validated['ids'])->delete();

        return redirect()
            ->back()
            ->with('success', 'Selected employee records deleted successfully.');
    }

    /**
     * Stream formal monochrome Statement of Account PDF for an employee
     */
    public function downloadStatementOfAccountPdf($id)
    {
        $employee = Employee::findOrFail($id);
        $latestPayroll = $employee->payrolls()->latest('period_end')->first();

        $advancements = Advancement::where('employee_id', $employee->id)
            ->whereIn('status', ['pending_payout', 'paid_out', 'partially_deducted'])
            ->whereNotIn('status', ['cancelled', 'deducted', 'fully_repaid'])
            ->latest('advancement_date')
            ->get();

        $soaNumber = 'SOA-' . ($employee->employee_code ?? ('EMP-' . str_pad((string) $employee->id, 3, '0', STR_PAD_LEFT))) . '-' . now()->format('Ymd');
        $dateIssued = now()->format('F d, Y');

        $basicPay = (float) ($latestPayroll->basic_pay ?? round(($employee->daily_rate ?? 0) * 13, 2));
        $grossPay = (float) ($latestPayroll->gross_pay ?? $basicPay);
        $cashAdvancePayout = (float) ($latestPayroll->cash_advance_payout ?? 0);
        $cashAdvanceDeduction = (float) ($latestPayroll->cash_advance_deduction ?? 0);

        $data = [
            'soa_number'             => $soaNumber,
            'date_issued'            => $dateIssued,
            'payroll_id'             => $latestPayroll?->id,
            'employee_code'          => $employee->employee_code ?? ('EMP-' . str_pad((string) $employee->id, 3, '0', STR_PAD_LEFT)),
            'employee_name'          => $employee->name ?? 'N/A',
            'position'               => $employee->position ?? 'N/A',
            'address'                => $employee->address ?? 'N/A',
            'contact_number'         => $employee->contact_number ?? 'N/A',
            'tin'                    => $employee->tin ?? 'N/A',
            'sss_no'                 => $employee->sss_no ?? 'N/A',
            'pagibig_no'             => $employee->pagibig_no ?? 'N/A',
            'philhealth_no'          => $employee->philhealth_no ?? 'N/A',
            'daily_rate'             => (float) ($employee->daily_rate ?? 0),
            'period_start'           => $latestPayroll?->period_start?->toDateString() ?? now()->startOfMonth()->toDateString(),
            'period_end'             => $latestPayroll?->period_end?->toDateString() ?? now()->endOfMonth()->toDateString(),
            'days_worked'            => $latestPayroll->days_worked ?? 13,
            'total_hours'            => $latestPayroll->total_hours ?? 104,
            'basic_pay'              => $basicPay,
            'overtime_hours'         => (float) ($latestPayroll->overtime_hours ?? 0),
            'overtime_pay'           => (float) ($latestPayroll->overtime_pay ?? 0),
            'holidays'               => (int) ($latestPayroll->holidays ?? 0),
            'holiday_pay'            => (float) ($latestPayroll->holiday_pay ?? 0),
            'cash_advance_payout'    => $cashAdvancePayout,
            'gross_pay'              => $grossPay,
            'sss_contribution'       => (float) ($employee->sss_contribution ?? 0),
            'sss_loan'               => (float) ($latestPayroll->sss_loan ?? $employee->sss_loan ?? 0),
            'pagibig_contribution'   => (float) ($employee->pagibig_contribution ?? 200.00),
            'pagibig_loan'           => (float) ($latestPayroll->pagibig_loan ?? $employee->pagibig_loan ?? 0),
            'philhealth_contribution' => (float) ($employee->philhealth_contribution ?? 0),
            'emergency_loan'         => (float) ($latestPayroll->emergency_loan ?? $employee->emergency_loan ?? 0),
            'withholding_tax'        => (float) ($employee->withholding_tax ?? 0),
            'cash_advance_deduction' => $cashAdvanceDeduction,
            'deductions'             => (float) ($latestPayroll->deductions ?? ($employee->sss_contribution + $employee->pagibig_contribution + $employee->philhealth_contribution + $cashAdvanceDeduction)),
            'net_pay'                => (float) ($latestPayroll->net_pay ?? max(0, $grossPay - ($latestPayroll->deductions ?? 0))),
            'advancements'           => $advancements,
        ];

        $pdf = Pdf::loadView('pdfs.statement_of_account', $data)->setPaper('a4', 'portrait');

        return $pdf->stream("soa_{$employee->id}_" . now()->format('Ymd') . ".pdf");
    }
}
