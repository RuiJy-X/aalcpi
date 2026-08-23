<?php

namespace App\Http\Controllers;

use App\Models\Advancement;
use App\Models\Employee;
use Carbon\Carbon;
use Illuminate\Http\Request;
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
                'employee_code' => $adv->employee?->employee_code ?? ('EMP-'.str_pad((string) $adv->employee_id, 3, '0', STR_PAD_LEFT)),
                'position' => $adv->employee?->position ?? 'Encoder',
                'amount' => (float) $adv->amount,
                'remaining_balance' => (float) $adv->remaining_balance,
                'advancement_date' => $adv->advancement_date?->toDateString(),
                'status' => $adv->status,
                'payout_payroll_id' => $adv->payout_payroll_id,
                'deduction_payroll_id' => $adv->deduction_payroll_id,
                'repayment_term_type' => $adv->repayment_term_type ?? 'full',
                'repayment_terms' => $adv->repayment_terms ? (int) $adv->repayment_terms : null,
                'installment_amount' => $adv->installment_amount !== null ? (float) $adv->installment_amount : (float) $adv->amount,
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
                    'employee_code' => $adv->employee?->employee_code ?? ('EMP-'.str_pad((string) $adv->employee_id, 3, '0', STR_PAD_LEFT)),
                    'position' => $adv->employee?->position ?? 'Encoder',
                    'amount' => (float) $adv->amount,
                    'remaining_balance' => (float) $adv->remaining_balance,
                    'advancement_date' => $adv->advancement_date?->toDateString(),
                    'status' => $adv->status,
                    'payout_payroll_id' => $adv->payout_payroll_id,
                    'deduction_payroll_id' => $adv->deduction_payroll_id,
                    'repayment_term_type' => $adv->repayment_term_type ?? 'full',
                    'repayment_terms' => $adv->repayment_terms ? (int) $adv->repayment_terms : null,
                    'installment_amount' => $adv->installment_amount !== null ? (float) $adv->installment_amount : (float) $adv->amount,
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
            'repayment_term_type' => 'nullable|string|in:full,months,payrolls,fixed_amount',
            'repayment_terms' => 'nullable|integer|min:1',
            'installment_amount' => 'nullable|numeric|min:0.01',
            'notes' => 'nullable|string|max:500',
        ]);

        $amount = (float) $validated['amount'];
        $repaymentTermType = $validated['repayment_term_type'] ?? 'full';
        $repaymentTerms = isset($validated['repayment_terms']) ? (int) $validated['repayment_terms'] : null;
        $installmentAmount = null;

        if ($repaymentTermType === 'months') {
            // Semi-monthly payroll: 2 cutoffs per month. E.g. 5 months = 10 cutoffs
            $cutoffs = max(1, ($repaymentTerms ?? 1) * 2);
            $installmentAmount = round($amount / $cutoffs, 2);
        } elseif ($repaymentTermType === 'payrolls') {
            $cutoffs = max(1, $repaymentTerms ?? 1);
            $installmentAmount = round($amount / $cutoffs, 2);
        } elseif ($repaymentTermType === 'fixed_amount') {
            $installmentAmount = isset($validated['installment_amount']) ? (float) $validated['installment_amount'] : $amount;
        } else {
            $repaymentTermType = 'full';
            $installmentAmount = $amount;
        }

        $advancement = Advancement::create([
            'employee_id' => $validated['employee_id'],
            'amount' => $amount,
            'remaining_balance' => $amount,
            'advancement_date' => Carbon::parse($validated['advancement_date']),
            'status' => 'pending_payout',
            'repayment_term_type' => $repaymentTermType,
            'repayment_terms' => $repaymentTerms,
            'installment_amount' => $installmentAmount,
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
