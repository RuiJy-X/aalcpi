<?php

namespace App\Http\Controllers;
use Inertia\Inertia;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class EmployeeController extends Controller
{

    public function get()
    {
        return Employee::orderBy('name', 'asc')->get();
    }

    public function header()
    {
        return response()->json(Schema::getColumnListing('employees'));
    }

    public function create(Request $request)
    {
        $validated = $request->validate([
            'name'            => 'required|string|max:255',
            'position'        => 'required|string',
            'employment_type' => 'required|in:Regular,Seasonal,Contractual',
            'base_salary'     => 'required|numeric|min:0',
            'hire_date'       => 'required|date',
        ]);

        $employee = Employee::create($validated);
        return response()->json(['message' => 'Employee added!', 'employee' => $employee], 201);
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
            'name'            => 'sometimes|string|max:255',
            'position'        => 'sometimes|string',
            'employment_type' => 'sometimes|in:Regular,Seasonal,Contractual',
            'base_salary'     => 'sometimes|numeric',
            'hire_date'       => 'sometimes|date',
        ]);

        $employee->update($validated);
        return response()->json(['message' => 'Employee profile updated!']);
    }

    public function destroy($id)
    {
        $employee = Employee::findOrFail($id);
        $employee->delete();
        return response()->json(['message' => 'Employee removed successfully']);
    }

}
