<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Payroll;
use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class PayrollController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
    }

    public function get()
    {
        return Payroll::with('employee:id,name')->latest('period_end')->get();
    }

    public function header()
    {
        return response()->json(Schema::getColumnListing('payrolls'));
    }

    public function create(Request $request)
    {
        $validated = $request->validate([
            'employee_id'           => 'required|exists:employees,id',
            'period_start'          => 'required|date',
            'period_end'            => 'required|date|after_or_equal:period_start',
            'base_salary'           => 'required|numeric',
            'total_overtime_hours'  => 'nullable|numeric',
            'total_deductions'      => 'nullable|numeric',
            'gross_pay'             => 'required|numeric',
            'net_pay'               => 'required|numeric',
            'status'                => 'required|in:draft,released,paid',
        ]);

        $payroll = Payroll::create($validated);

        return response()->json([
            'message' => 'Payroll generated successfully!',
            'data' => $payroll
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $payroll = Payroll::findOrFail($id);

        $validated = $request->validate([
            'status'           => 'sometimes|in:draft,released,paid',
            'total_deductions' => 'sometimes|numeric',
            'net_pay'          => 'sometimes|numeric',
        ]);

        $payroll->update($validated);

        return response()->json(['message' => 'Payroll updated!']);
    }

    public function destroy($id)
    {
        Payroll::findOrFail($id)->delete();
        return response()->json(['message' => 'Payroll record deleted']);
    }
}
