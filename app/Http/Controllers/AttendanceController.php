<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\Attendance;
use Illuminate\Support\Facades\Schema;

class AttendanceController extends Controller
{
    public function get()
    {
        return response()->json(Attendance::with('employee:id,name')->latest('date')->get());
    }

    public function header()
    {
        return response()->json(Schema::getColumnListing('attendances'));
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
}
