<?php

namespace App\Http\Controllers;

use App\Models\Hacienda;
use App\Models\Planter;
use App\Models\Production;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $planterStats = [
            'totalPlanters' => Planter::query()->count('id'),
            'totalHaciendas' => Hacienda::query()->count('id'),
            'totalProductions' => Production::query()->count('id'),
        ];

        $haciendaStats = [
            'totalHaciendas' => Hacienda::query()->count('id'),
            'totalArea' => Hacienda::query()->sum('area_hectares'),
            'uniquePlanters' => Hacienda::query()
                ->distinct('planter_id')
                ->count('planter_id'),
            'activeHaciendas' => Hacienda::query()
                ->where('is_active', true)
                ->count('id'),
        ];

        $productionStats = [
            'totalProductions' => Production::query()->count('id'),
            'totalNetCw' => Production::query()->sum('net_cw'),
            'totalActualLkg' => Production::query()->sum('actual_lkg'),
            'totalPshrNetLkg' => Production::query()->sum('pshr_net_lkg'),
            'totalActualMol' => Production::query()->sum('actual_mol'),
            'totalPshrNetMol' => Production::query()->sum('pshr_net_mol'),
        ];

        return Inertia::render('dashboard', [
            'planter_stats' => $planterStats,
            'hacienda_stats' => $haciendaStats,
            'production_stats' => $productionStats,
        ]);
    }
}
