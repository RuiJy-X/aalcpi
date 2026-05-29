<?php

namespace App\Http\Controllers;


use Inertia\Inertia;
use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Employee;
use App\Models\PayrollCalculationSetting;
use App\Models\Payroll;
use Illuminate\Http\Request;

class EmployeeController extends Controller
{

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

        return Inertia::render('Employees/Show', [
            'employee' => $employee,
            'attendance' => $attendance,
            'payrolls' => $payrolls,
        ]);
    }


    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'            => 'required|string|max:255',
            'employee_code'   => 'required|string|unique:employees,employee_code',
            'position'        => 'sometimes|string',
            'employment_type' => 'sometimes|string',
            'department' => 'sometimes|string|max:255',
            'base_salary'     => 'required|numeric|min:0',
            'hourly_rate'     => 'sometimes|numeric|min:0',
            'address'         => 'sometimes|string|max:255',
            'tin'             => 'sometimes|string|max:255',
            'contact_number'  => 'sometimes|string|max:255',
        ]);

        $validated['hourly_rate'] = $this->calculateHourlyRate(
            $validated['base_salary'],
            $this->getHourlyRateSettings(),
        );

        $employee = Employee::create($validated);
         return redirect()->back()->with('success', 'Employee created successfully!');
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

    public function update(Request $request, $id)
    {
        $employee = Employee::findOrFail($id);

        $validated = $request->validate([
            'name'            => 'required|string|max:255',
            'employee_code'   => 'required|string',
            'position'        => 'sometimes|string',
            'employment_type' => 'sometimes|string',
            'department' => 'sometimes|string|max:255',
            'base_salary'     => 'required|numeric|min:0',
            'hourly_rate'     => 'sometimes|numeric|min:0',
            'address'         => 'sometimes|string|max:255',
            'tin'             => 'sometimes|string|max:255',
            'contact_number'  => 'sometimes|string|max:255',
        ]);

        $validated['hourly_rate'] = $this->calculateHourlyRate(
            $validated['base_salary'],
            $this->getHourlyRateSettings(),
        );

        $employee->update($validated);
        return redirect()->back()->with('success', 'Employee updated successfully!');
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

}
