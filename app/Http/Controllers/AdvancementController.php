<?php

namespace App\Http\Controllers;

use App\Models\Advancement;
use App\Models\Employee;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Inertia\Inertia;

class AdvancementController extends Controller
{
    /**
     * Render dedicated Cash Advancements Management Hub Page
     */
    public function page()
    {
        $raw = Advancement::with('employee:id,name,employee_code,position')
            ->latest('advancement_date')
            ->get();

        $advancements = $raw->map(function ($adv) {
            return [
                'id' => $adv->id,
                'employee_id' => $adv->employee_id,
                'employee_name' => $adv->employee?->name ?? 'N/A',
                'employee_code' => $adv->employee?->employee_code ?? ('EMP-' . str_pad((string) $adv->employee_id, 3, '0', STR_PAD_LEFT)),
                'position' => $adv->employee?->position ?? 'Encoder',
                'amount' => (float) $adv->amount,
                'remaining_balance' => (float) $adv->remaining_balance,
                'advancement_date' => $adv->advancement_date?->toDateString(),
                'status' => $adv->status,
                'payout_payroll_id' => $adv->payout_payroll_id,
                'deduction_payroll_id' => $adv->deduction_payroll_id,
                'notes' => $adv->notes,
                'created_at' => $adv->created_at?->toDateTimeString(),
            ];
        });

        $totals = [
            'total_granted' => (float) $raw->where('status', '!=', 'cancelled')->sum('amount'),
            'pending_payout' => (float) $raw->where('status', 'pending_payout')->sum('amount'),
            'outstanding_repayment' => (float) $raw->whereIn('status', ['paid_out', 'partially_deducted'])->sum('remaining_balance'),
            'fully_repaid' => (float) $raw->where('status', 'deducted')->sum('amount'),
        ];

        $employees = Employee::orderBy('name')
            ->get(['id', 'name', 'employee_code', 'position']);

        return Inertia::render('Advancements/Index', [
            'advancements' => $advancements,
            'totals' => $totals,
            'employees' => $employees,
        ]);
    }

    public function index()
    {
        $advancements = Advancement::with('employee:id,name,employee_code,position')
            ->latest('advancement_date')
            ->get()
            ->map(function ($adv) {
                return [
                    'id' => $adv->id,
                    'employee_id' => $adv->employee_id,
                    'employee_name' => $adv->employee?->name ?? 'N/A',
                    'employee_code' => $adv->employee?->employee_code ?? ('EMP-' . str_pad((string) $adv->employee_id, 3, '0', STR_PAD_LEFT)),
                    'position' => $adv->employee?->position ?? 'Encoder',
                    'amount' => (float) $adv->amount,
                    'remaining_balance' => (float) $adv->remaining_balance,
                    'advancement_date' => $adv->advancement_date?->toDateString(),
                    'status' => $adv->status,
                    'payout_payroll_id' => $adv->payout_payroll_id,
                    'deduction_payroll_id' => $adv->deduction_payroll_id,
                    'notes' => $adv->notes,
                    'created_at' => $adv->created_at?->toDateTimeString(),
                ];
            });

        return response()->json([
            'success' => true,
            'advancements' => $advancements,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'amount' => 'required|numeric|min:1',
            'advancement_date' => 'required|date',
            'notes' => 'nullable|string|max:500',
        ]);

        $amount = (float) $validated['amount'];

        $advancement = Advancement::create([
            'employee_id' => $validated['employee_id'],
            'amount' => $amount,
            'remaining_balance' => $amount,
            'advancement_date' => Carbon::parse($validated['advancement_date']),
            'status' => 'pending_payout',
            'notes' => $validated['notes'] ?? null,
        ]);

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json([
                'success' => true,
                'message' => 'Salary advancement granted successfully!',
                'advancement' => $advancement,
            ]);
        }

        return redirect()->back()->with('success', 'Salary advancement granted successfully!');
    }

    public function destroy($id)
    {
        $advancement = Advancement::findOrFail($id);

        if ($advancement->status !== 'pending_payout') {
            if (request()->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Only pending advancements can be cancelled.',
                ], 422);
            }
            return redirect()->back()->withErrors(['message' => 'Only pending advancements can be cancelled.']);
        }

        $advancement->update(['status' => 'cancelled']);

        if (request()->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Advancement request cancelled successfully.',
            ]);
        }

        return redirect()->back()->with('success', 'Advancement request cancelled successfully.');
    }
}
