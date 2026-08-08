<?php

namespace App\Http\Controllers;


use Inertia\Inertia;
use App\Http\Controllers\Controller;
use App\Http\Controllers\Concerns\HandlesBulkUpdates;
use App\Models\Attendance;
use App\Models\Employee;
use App\Models\PayrollCalculationSetting;
use App\Models\Payroll;
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
                'days_per_month' => $settings?->days_per_month ?? 24,
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
            ->latest('period_end')
            ->get()
            ->map(function (Payroll $record) use ($employee) {
                return [
                    'id' => $record->id,
                    'employee_id' => $record->employee_id,
                    'employee_name' => $employee->name,
                    'period_start' => $record->period_start,
                    'period_end' => $record->period_end,
                    'days_worked' => $record->days_worked,
                    'total_days' => $record->total_days,
                    'total_hours' => $record->total_hours,
                    'hours_worked' => $record->hours_worked,
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
                'days_per_month' => $settings?->days_per_month ?? 24,
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
            'sss_loan'                 => 'nullable|numeric|min:0',
            'pagibig_loan'             => 'nullable|numeric|min:0',
            'emergency_loan'           => 'nullable|numeric|min:0',
            'pagibig_contribution'     => 'nullable|numeric|min:0',
            'sss_contribution'         => 'nullable|numeric|min:0',
            'philhealth_contribution'   => 'nullable|numeric|min:0',
            'withholding_tax'          => 'nullable|numeric|min:0',
        ]);

        $settings = $this->getHourlyRateSettings();
        $daysPerMonth = (int) ($settings['days_per_month'] ?? 24);
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
            'sss_loan'                 => 'nullable|numeric|min:0',
            'pagibig_loan'             => 'nullable|numeric|min:0',
            'emergency_loan'           => 'nullable|numeric|min:0',
            'pagibig_contribution'     => 'nullable|numeric|min:0',
            'sss_contribution'         => 'nullable|numeric|min:0',
            'philhealth_contribution'   => 'nullable|numeric|min:0',
            'withholding_tax'          => 'nullable|numeric|min:0',
        ]);

        $settings = $this->getHourlyRateSettings();
        $daysPerMonth = (int) ($settings['days_per_month'] ?? 24);
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
                'sss_loan' => ['sometimes', 'nullable', 'numeric', 'min:0'],
                'pagibig_loan' => ['sometimes', 'nullable', 'numeric', 'min:0'],
                'emergency_loan' => ['sometimes', 'nullable', 'numeric', 'min:0'],
                'pagibig_contribution' => ['sometimes', 'nullable', 'numeric', 'min:0'],
                'sss_contribution' => ['sometimes', 'nullable', 'numeric', 'min:0'],
                'philhealth_contribution' => ['sometimes', 'nullable', 'numeric', 'min:0'],
                'withholding_tax' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            ],
            function (Employee $employee, array $payload): array {
                $settings = $this->getHourlyRateSettings();
                $hoursPerDay = (float) ($settings['hours_per_day'] ?? 8);
                $daysPerMonth = (int) ($settings['days_per_month'] ?? 24);

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
            'days_per_month' => $settings?->days_per_month ?? 24,
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

}
