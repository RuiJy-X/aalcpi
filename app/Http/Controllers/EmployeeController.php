<?php

namespace App\Http\Controllers;


use Inertia\Inertia;
use App\Http\Controllers\Controller;
use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class EmployeeController extends Controller
{

    public function index()
    {
        $employees = Employee::all();
        return Inertia::render('Employees/Index', ['employees' => $employees]);
    }

    public function show($id)
    {
        $employee = Employee::findOrFail($id);

        return Inertia::render('Employees/Show', [
            'employee' => $employee,
        ]);
    }


    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'            => 'required|string|max:255',
            'position'        => 'sometimes|string',
            'employment_type' => 'sometimes|string',
            'department' => 'sometimes|string|max:255',
            'base_salary'     => 'required|numeric|min:0',
            'hourly_rate'     => 'sometimes|numeric|min:0',
            'address'         => 'sometimes|string|max:255',
            'tin'             => 'sometimes|string|max:255',
            'contact_number'  => 'sometimes|string|max:255',
        ]);

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
            'position'        => 'sometimes|string',
            'employment_type' => 'sometimes|string',
            'department' => 'sometimes|string|max:255',
            'base_salary'     => 'required|numeric|min:0',
            'hourly_rate'     => 'sometimes|numeric|min:0',
            'address'         => 'sometimes|string|max:255',
            'tin'             => 'sometimes|string|max:255',
            'contact_number'  => 'sometimes|string|max:255',
        ]);

        $employee->update($validated);
        return redirect()->back()->with('success', 'Employee updated successfully!');
    }

    public function destroy($id)
    {
        $employee = Employee::findOrFail($id);
        $employee->delete();
        return redirect()->back()->with('success', 'Employee removed successfully!');
    }

}
