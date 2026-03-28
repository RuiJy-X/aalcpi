<?php

namespace App\Http\Controllers;

use App\Models\Certification;
use App\Models\Production;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $seasonYear = Production::query()->max('production_year') ?? (int) Carbon::now()->year;

        $seasonProductions = Production::query()
            ->where('production_year', $seasonYear)
            ->get([
                'id',
                'net_cw',
                'trucks',
                'theoretical_lkg',
                'actual_lkg',
                'pshr_net_lkg',
                'association_dues_lkg',
                'association_dues_mol',
                'actual_mol',
                'pshr_net_mol',
            ]);

        $totalTheoreticalLkg = (float) $seasonProductions->sum('theoretical_lkg');
        $totalActualLkg = (float) $seasonProductions->sum('actual_lkg');

        $completedStatuses = ['certified', 'completed', 'approved', 'generated'];

        $pendingCount = static fn (string $type): int => Certification::query()
            ->where('certification_type', $type)
            ->whereHas('production', static function ($query) use ($seasonYear) {
                $query->where('production_year', $seasonYear);
            })
            ->whereRaw('LOWER(status) NOT IN (?, ?, ?, ?)', $completedStatuses)
            ->count();

        return Inertia::render('dashboard', [
            'seasonYear' => $seasonYear,
            'kpis' => [
                'totalMilledCw' => (float) $seasonProductions->sum('net_cw'),
                'truckCount' => (int) $seasonProductions->sum('trucks'),
                'totalActualLkg' => $totalActualLkg,
                'totalTheoreticalLkg' => $totalTheoreticalLkg,
                'efficiencyRate' => $totalTheoreticalLkg > 0
                    ? round(($totalActualLkg / $totalTheoreticalLkg) * 100, 2)
                    : 0,
                'planterDistributionsLkg' => (float) $seasonProductions->sum('pshr_net_lkg'),
                'associationDuesLkg' => (float) $seasonProductions->sum('association_dues_lkg'),
                'associationDuesMol' => (float) $seasonProductions->sum('association_dues_mol'),
                'actualMol' => (float) $seasonProductions->sum('actual_mol'),
                'pshrNetMol' => (float) $seasonProductions->sum('pshr_net_mol'),
            ],
            'certificationPipeline' => [
                [
                    'label' => 'Final Data Certificates',
                    'pending' => $pendingCount('Final Data Certificate'),
                ],
                [
                    'label' => 'Weekly Reports',
                    'pending' => $pendingCount('Weekly Report'),
                ],
                [
                    'label' => 'Bank Authorizations',
                    'pending' => $pendingCount('Bank Authorization'),
                ],
            ],
        ]);
    }
}
