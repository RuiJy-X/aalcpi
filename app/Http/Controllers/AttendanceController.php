<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\HandlesBulkUpdates;
use App\Imports\AttendanceImport;
use App\Models\Attendance;
use App\Models\Employee;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\ValidationException;
use Maatwebsite\Excel\Facades\Excel;

class AttendanceController extends Controller
{
    use HandlesBulkUpdates;

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
            'date' => 'sometimes|date',
            'time_in' => 'sometimes|nullable|string|max:50',
            'time_out' => 'sometimes|nullable|string|max:50',
            'times' => 'sometimes|nullable|string|max:255',
            'working_time' => 'sometimes|nullable|string|max:50',
            'week' => 'sometimes|nullable|string|max:50',
        ]);

        $attendance->update($validated);

        return response()->json([
            'message' => 'Attendance updated successfully!',
            'data' => $attendance
        ]);
    }

    public function bulkUpdate(Request $request)
    {
        return $this->performBulkUpdate(
            $request,
            Attendance::class,
            [
                'date' => ['sometimes', 'nullable', 'date'],
                'time_in' => ['sometimes', 'nullable', 'string', 'max:50'],
                'time_out' => ['sometimes', 'nullable', 'string', 'max:50'],
                'times' => ['sometimes', 'nullable', 'string', 'max:255'],
                'working_time' => ['sometimes', 'nullable', 'string', 'max:50'],
                'week' => ['sometimes', 'nullable', 'string', 'max:50'],
            ],
            successLabel: 'attendance record',
        );
    }

    public function destroy($id)
    {
        Attendance::findOrFail($id)->delete();
        return response()->json(['message' => 'Attendance record deleted']);
    }

    public function bulkDestroy(Request $request)
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'distinct', 'exists:attendances,id'],
        ]);

        Attendance::whereIn('id', $validated['ids'])->delete();

        return redirect()
            ->back()
            ->with('success', 'Selected attendance records deleted successfully.');
    }

    public function import(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls,csv'],
        ]);
        try {
            $import = new AttendanceImport();
            Excel::import($import, $validated['file']);

            if ($import->importedCount === 0) {
                throw ValidationException::withMessages([
                    'file' => 'No attendance records were imported from the file.',
                ]);
            }

            return back()->with(
                'success',
                "Attendance imported successfully ({$import->importedCount} rows)."
            );
        } catch (ValidationException $exception) {
            throw $exception;
        } catch (\Throwable $exception) {
            throw ValidationException::withMessages([
                'file' => 'Error importing attendance: ' . $exception->getMessage(),
            ]);
        }
    }
}
