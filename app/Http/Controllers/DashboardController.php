<?php

namespace App\Http\Controllers;

use App\Models\MillingPeriod;
use App\Models\Production;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $cropYears = Production::query()
            ->whereNotNull('crop_year')
            ->distinct()
            ->orderBy('crop_year', 'desc')
            ->pluck('crop_year')
            ->values();

        $requestedCropYear = $request->input('crop_year');
        $selectedCropYear = $cropYears->contains($requestedCropYear)
            ? $requestedCropYear
            : $cropYears->first();

        $productionQuery = Production::query()->when(
            $selectedCropYear,
            fn ($query) => $query->where('crop_year', $selectedCropYear),
        );

        $productionTotals = (clone $productionQuery)
            ->selectRaw(
                'COALESCE(SUM(gross_cw), 0) as gross_cw,
                 COALESCE(SUM(net_cw), 0) as net_cw,
                 COALESCE(SUM(trucks), 0) as trucks,
                 COALESCE(SUM(actual_lkg), 0) as actual_lkg,
                 COALESCE(SUM(pshr_net_lkg), 0) as pshr_net_lkg,
                 COALESCE(SUM(actual_mol), 0) as actual_mol,
                 COALESCE(SUM(pshr_net_mol), 0) as pshr_net_mol'
            )
            ->first();

        $entityCounts = [
            'planters' => (clone $productionQuery)
                ->distinct('planter_code')
                ->count('planter_code'),
            'haciendas' => (clone $productionQuery)
                ->distinct('hacienda_code')
                ->count('hacienda_code'),
        ];

        $trendData = Production::query()
            ->whereNotNull('crop_year')
            ->selectRaw(
                'crop_year,
                 COALESCE(SUM(gross_cw), 0) as gross_cw,
                 COALESCE(SUM(net_cw), 0) as net_cw,
                 COALESCE(SUM(trucks), 0) as trucks,
                 COALESCE(SUM(actual_lkg), 0) as actual_lkg,
                 COALESCE(SUM(pshr_net_lkg), 0) as pshr_net_lkg,
                 COALESCE(SUM(actual_mol), 0) as actual_mol,
                 COALESCE(SUM(pshr_net_mol), 0) as pshr_net_mol'
            )
            ->groupBy('crop_year')
            ->orderBy('crop_year')
            ->get();

        $planterLeaderboard = Production::query()
            ->join('planters', 'productions.planter_id', '=', 'planters.id')
            ->leftJoin('haciendas', 'productions.hacienda_id', '=', 'haciendas.id')
            ->when(
                $selectedCropYear,
                fn ($query) => $query->where('productions.crop_year', $selectedCropYear),
            )
            ->selectRaw(
                'productions.planter_id as planter_id,
                 planters.name as planter_name,
                 COALESCE(MIN(haciendas.name), \'\') as hacienda_name,
                 COALESCE(SUM(gross_cw), 0) as gross_cw,
                 COALESCE(SUM(net_cw), 0) as net_cw,
                 COALESCE(SUM(trucks), 0) as trucks,
                 COALESCE(SUM(actual_lkg), 0) as actual_lkg,
                 COALESCE(SUM(pshr_net_lkg), 0) as pshr_net_lkg,
                 COALESCE(SUM(actual_mol), 0) as actual_mol,
                 COALESCE(SUM(pshr_net_mol), 0) as pshr_net_mol'
            )
            ->groupBy('productions.planter_id', 'planters.name')
            ->get();

        $millingPeriods = MillingPeriod::query()
            ->when(
                $selectedCropYear,
                fn ($query) => $query->where('crop_year', $selectedCropYear),
            )
            ->orderBy('start_date')
            ->get([
                'id',
                'week_no',
                'crop_year',
                'start_date',
                'end_date',
                'sugar_price',
                'mol_price',
                'sugar_factor',
                'mol_factor',
            ]);

        return Inertia::render('dashboard', [
            'crop_years' => $cropYears,
            'filters' => [
                'crop_year' => $selectedCropYear,
            ],
            'kpi_totals' => $productionTotals,
            'entity_counts' => $entityCounts,
            'trend_data' => $trendData,
            'leaderboard' => $planterLeaderboard,
            'milling_periods' => $millingPeriods,
        ]);
    }
}
