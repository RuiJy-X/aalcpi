<?php

namespace App\Http\Controllers;

use App\Models\MillingPeriod;
use App\Models\Production;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ProductionDistributionController extends Controller
{
    public function index(Request $request): Response
    {
        $selectedCropYear = $request->string('crop_year')->toString();
        $selectedWeek = $request->string('week_no')->toString();
        $selectedStatus = $request->string('financial_status')->toString();

        $millingPeriods = MillingPeriod::query()
            ->orderByDesc('crop_year')
            ->orderBy('week_no')
            ->get();

        $query = Production::query()
            ->with(['planter', 'hacienda', 'millingPeriod'])
            ->whereNotNull('milling_period_id')
            ->orderByDesc('id');

        if ($selectedCropYear !== '' && $selectedCropYear !== 'all') {
            $query->whereHas('millingPeriod', function ($periodQuery) use ($selectedCropYear): void {
                $periodQuery->where('crop_year', $selectedCropYear);
            });
        }

        if ($selectedWeek !== '' && $selectedWeek !== 'all') {
            $query->whereHas('millingPeriod', function ($periodQuery) use ($selectedWeek): void {
                $periodQuery->where('week_no', (int) $selectedWeek);
            });
        }

        if ($selectedStatus !== '' && $selectedStatus !== 'all') {
            $query->where('financial_status', $selectedStatus);
        }

        $productions = $query->get()->map(function (Production $production) {
            $production->planter_name = $production->planter?->name;
            $production->hacienda_name = $production->hacienda?->name;
            $production->hacienda_address = $production->hacienda?->address;
            $production->crop_year = $production->millingPeriod?->crop_year;
            $production->week_no = $production->millingPeriod?->week_no;

            return $production;
        })->values();

        $cropYears = $millingPeriods
            ->pluck('crop_year')
            ->filter()
            ->unique()
            ->values();

        $weeksByCropYear = $millingPeriods
            ->groupBy('crop_year')
            ->map(fn ($periods) => $periods->pluck('week_no')->unique()->sort()->values())
            ->toArray();

        return Inertia::render('Distributions/Index', [
            'productions' => $productions,
            'crop_years' => $cropYears,
            'weeks_by_crop_year' => $weeksByCropYear,
            'status_options' => [
                Production::FINANCIAL_STATUS_PENDING_PRICE,
                Production::FINANCIAL_STATUS_CALCULATED_PENDING_REVIEW,
                Production::FINANCIAL_STATUS_ACCEPTED,
            ],
            'filters' => [
                'crop_year' => $selectedCropYear,
                'week_no' => $selectedWeek,
                'financial_status' => $selectedStatus,
            ],
        ]);
    }

    public function accept(string $productionId): RedirectResponse
    {
        $production = Production::query()->findOrFail($productionId);

        if ($production->financial_status !== Production::FINANCIAL_STATUS_CALCULATED_PENDING_REVIEW) {
            return redirect()->back()->with('success', 'Only records pending review can be accepted.');
        }

        $production->update([
            'financial_status' => Production::FINANCIAL_STATUS_ACCEPTED,
            'financial_reviewed_at' => now(),
            'financial_reviewed_by' => Auth::id(),
            'financial_rejection_reason' => null,
        ]);

        return redirect()->back()->with('success', 'Financial distribution accepted. Payout voucher is now unlocked for printing.');
    }

    public function reject(Request $request, string $productionId): RedirectResponse
    {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'min:5', 'max:1000'],
        ]);

        $production = Production::query()->findOrFail($productionId);

        if ($production->financial_status === Production::FINANCIAL_STATUS_ACCEPTED) {
            return redirect()->back()->with('success', 'Accepted records are read-only and cannot be rejected.');
        }

        $production->update([
            'financial_status' => Production::FINANCIAL_STATUS_PENDING_PRICE,
            'distribution_total' => null,
            'molasses_total' => null,
            'planter_lkg_money' => null,
            'pdpa_lkg_money' => null,
            'association_dues_lkg_money' => null,
            'planter_mol_money' => null,
            'pdpa_mol_money' => null,
            'association_dues_mol_money' => null,
            'financial_calculated_at' => null,
            'financial_reviewed_at' => now(),
            'financial_reviewed_by' => Auth::id(),
            'financial_rejection_reason' => $validated['reason'],
        ]);

        return redirect()->back()->with('success', 'Financial distribution rejected and moved back to pending.');
    }

    public function cancelAcceptance(Request $request, string $productionId): RedirectResponse
    {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'min:5', 'max:1000'],
        ]);

        $production = Production::query()->findOrFail($productionId);

        if ($production->financial_status !== Production::FINANCIAL_STATUS_ACCEPTED) {
            return redirect()->back()->with('success', 'Only accepted records can be canceled.');
        }

        $production->update([
            'financial_status' => Production::FINANCIAL_STATUS_PENDING_PRICE,
            'distribution_total' => null,
            'molasses_total' => null,
            'planter_lkg_money' => null,
            'pdpa_lkg_money' => null,
            'association_dues_lkg_money' => null,
            'planter_mol_money' => null,
            'pdpa_mol_money' => null,
            'association_dues_mol_money' => null,
            'financial_calculated_at' => null,
            'financial_reviewed_at' => now(),
            'financial_reviewed_by' => Auth::id(),
            'financial_rejection_reason' => 'Acceptance canceled: ' . $validated['reason'],
        ]);

        return redirect()->back()->with('success', 'Accepted distribution was canceled and moved back to pending.');
    }

    public function voucher(string $productionId)
    {
        $production = Production::query()
            ->with(['planter', 'hacienda', 'millingPeriod'])
            ->findOrFail($productionId);

        if ($production->financial_status !== Production::FINANCIAL_STATUS_ACCEPTED) {
            return redirect()->back()->with('success', 'Voucher is only available for accepted distributions.');
        }

        $pdf = Pdf::loadView('pdfs.distribution_voucher', [
            'production' => $production,
        ])->setPaper('a4', 'portrait');

        return $pdf->stream('distribution_voucher_' . ($production->trans_code ?? $production->id) . '.pdf');
    }
}
