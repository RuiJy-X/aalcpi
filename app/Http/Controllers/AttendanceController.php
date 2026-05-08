<?php

namespace App\Http\Controllers;

use App\Imports\AttendanceImport;
use App\Models\Attendance;
use App\Models\Employee;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\ValidationException;

class AttendanceController extends Controller
{
    public function index()
    {
        $attendance = Attendance::with('employee:id,name')
            ->get()
            ->map(function (Attendance $record) {
                return [
                    'id' => $record->id,
                    'employee_id' => $record->employee_id,
                    'employee_name' => $record->employee?->name,
                    'date' => $record->date,
                    'week' => $record->week,
                    'time_in' => $record->time_in,
                    'time_out' => $record->time_out,
                    'times' => $record->times,
                    'working_time' => $record->working_time,
                ];
            });

        $employees = Employee::query()
            ->select('id', 'name')
            ->orderBy('name', 'asc')
            ->get();

        return Inertia::render('Attendance/Index', [
            'attendance' => $attendance,
            'employees' => $employees,
        ]);
    }

    public function show($id)
    {
        return response()->json(Attendance::with('employee:id,name')->findOrFail($id));
    }


    public function create(Request $request)
    {
        $validated = $request->validate([
            'employee_id'    => 'required|exists:employees,id',
            'date'           => 'required|date',
            'status'         => 'required|string',
            'hours_worked'   => 'required|numeric|min:0|max:24',
            'overtime_hours' => 'nullable|numeric|min:0|max:24',
        ]);

        $attendance = Attendance::create($validated);

        return response()->json([
            'message' => 'Attendance recorded successfully!',
            'data' => $attendance
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $attendance = Attendance::findOrFail($id);

        $validated = $request->validate([
            'date'           => 'sometimes|date',
            'status'         => 'sometimes|string',
            'hours_worked'   => 'sometimes|numeric',
            'overtime_hours' => 'sometimes|numeric',
        ]);

        $attendance->update($validated);

        return response()->json([
            'message' => 'Attendance updated successfully!',
            'data' => $attendance
        ]);
    }

    public function destroy($id)
    {
        Attendance::findOrFail($id)->delete();
        return response()->json(['message' => 'Attendance record deleted']);
    }

    public function import(Request $request): RedirectResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls,csv'],
        ]);

        // $employee = Employee::findOrFail($request->integer('employee_id'));

        $import = new AttendanceImport();
            //employeeId: $employee->id,


        Excel::import($import, $request->file('file'));

        if ($import->importedCount === 0) {
            throw ValidationException::withMessages([
                'file' => 'No attendance rows were imported for the selected employee and date range.',
            ]);
        }

        return back()->with('success', "DTR imported successfully.");
    }
}
