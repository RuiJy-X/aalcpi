<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\BankStatement;
use App\Models\Employee;
use App\Models\Hacienda;
use App\Models\ImportJob;
use App\Models\InternalDisbursements;
use App\Models\MillingPeriod;
use App\Models\Payroll;
use App\Models\Planter;
use App\Models\Production;
use App\Models\User;
use App\Models\Weekly;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

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
            'module_summaries' => $this->buildModuleSummaries($selectedCropYear),
            'status_tracking' => $this->buildStatusTracking($selectedCropYear),
            'recent_activity' => $this->buildRecentActivity(),
        ]);
    }

    /**
     * Per-module snapshot used for quick-access cards.
     *
     * @return list<array<string, mixed>>
     */
    private function buildModuleSummaries(?string $cropYear): array
    {
        $today = Carbon::today();

        $planterCount = Planter::query()->count();
        $haciendaCount = Hacienda::query()->count();
        $activeHaciendas = Hacienda::query()->where('is_active', true)->count();

        $productionTotal = Production::query()
            ->when($cropYear, fn ($q) => $q->where('crop_year', $cropYear))
            ->count();
        $productionCompleted = Production::query()
            ->when($cropYear, fn ($q) => $q->where('crop_year', $cropYear))
            ->where('status', 'completed')
            ->count();
        $productionDraft = max(0, $productionTotal - $productionCompleted);

        $weeklyCount = Weekly::query()
            ->when($cropYear, fn ($q) => $q->where('crop_year', $cropYear))
            ->count();
        $weeklyPlanters = Weekly::query()
            ->when($cropYear, fn ($q) => $q->where('crop_year', $cropYear))
            ->whereNotNull('planter_code')
            ->distinct()
            ->count('planter_code');
        $weeklyWeeks = Weekly::query()
            ->when($cropYear, fn ($q) => $q->where('crop_year', $cropYear))
            ->whereNotNull('week')
            ->distinct()
            ->count('week');

        $millingTotal = MillingPeriod::query()
            ->when($cropYear, fn ($q) => $q->where('crop_year', $cropYear))
            ->count();
        $millingActive = MillingPeriod::query()
            ->when($cropYear, fn ($q) => $q->where('crop_year', $cropYear))
            ->whereDate('start_date', '<=', $today)
            ->whereDate('end_date', '>=', $today)
            ->count();

        $employeeCount = Employee::query()->count();
        $attendanceThisMonth = Attendance::query()
            ->whereBetween('date', [
                $today->copy()->startOfMonth()->toDateString(),
                $today->copy()->endOfMonth()->toDateString(),
            ])
            ->count();

        $payrollTotal = Payroll::query()->count();
        $payrollPaid = Payroll::query()->where('status', 'paid')->count();
        $payrollPending = Payroll::query()->where('status', 'pending')->count();
        $payrollDraft = Payroll::query()->where('status', 'draft')->count();

        $userCount = User::query()->count();

        $recon = $this->bankReconSnapshot();

        $importsRunning = ImportJob::query()
            ->whereIn('status', [ImportJob::STATUS_QUEUED, ImportJob::STATUS_RUNNING])
            ->count();
        $importsFailed = ImportJob::query()
            ->where('status', ImportJob::STATUS_FAILED)
            ->where('created_at', '>=', now()->subDays(7))
            ->count();

        return [
            [
                'key' => 'planters',
                'title' => 'Planters',
                'permission' => 'planters.view',
                'href' => '/Planters',
                'metric' => $planterCount,
                'metric_label' => 'registered',
                'status' => $planterCount > 0 ? 'healthy' : 'empty',
                'status_label' => $planterCount > 0 ? 'Ready' : 'No data',
                'detail' => "{$haciendaCount} haciendas linked in system",
                'progress' => null,
                'accent' => 'green',
            ],
            [
                'key' => 'haciendas',
                'title' => 'Haciendas',
                'permission' => 'haciendas.view',
                'href' => '/Haciendas',
                'metric' => $haciendaCount,
                'metric_label' => 'total',
                'status' => $haciendaCount > 0 ? 'healthy' : 'empty',
                'status_label' => $activeHaciendas.' active',
                'detail' => $haciendaCount > 0
                    ? round(($activeHaciendas / max($haciendaCount, 1)) * 100).'% active'
                    : 'No haciendas yet',
                'progress' => $haciendaCount > 0
                    ? round(($activeHaciendas / $haciendaCount) * 100)
                    : 0,
                'accent' => 'purple',
            ],
            [
                'key' => 'productions',
                'title' => 'Productions',
                'permission' => 'productions.view',
                'href' => '/Productions',
                'metric' => $productionTotal,
                'metric_label' => $cropYear ? "records ({$cropYear})" : 'records',
                'status' => $productionDraft > 0 ? 'attention' : ($productionTotal > 0 ? 'healthy' : 'empty'),
                'status_label' => $productionCompleted.' completed · '.$productionDraft.' draft',
                'detail' => $productionTotal > 0
                    ? round(($productionCompleted / $productionTotal) * 100).'% completed'
                    : 'Import or create productions',
                'progress' => $productionTotal > 0
                    ? round(($productionCompleted / $productionTotal) * 100)
                    : 0,
                'accent' => 'amber',
            ],
            [
                'key' => 'weekly',
                'title' => 'Weekly Data',
                'permission' => 'weekly.view',
                'href' => '/Weekly',
                'metric' => $weeklyCount,
                'metric_label' => 'PDF files',
                'status' => $weeklyCount > 0 ? 'healthy' : 'empty',
                'status_label' => $weeklyPlanters.' planters · '.$weeklyWeeks.' weeks',
                'detail' => $cropYear
                    ? "Coverage for crop year {$cropYear}"
                    : 'Import weekly planter PDFs',
                'progress' => null,
                'accent' => 'teal',
            ],
            [
                'key' => 'milling_periods',
                'title' => 'Milling Periods',
                'permission' => 'milling_periods.view',
                'href' => '/MillingPeriods',
                'metric' => $millingTotal,
                'metric_label' => 'weeks defined',
                'status' => $millingActive > 0 ? 'healthy' : ($millingTotal > 0 ? 'idle' : 'empty'),
                'status_label' => $millingActive > 0 ? $millingActive.' active now' : 'None active',
                'detail' => $millingTotal > 0
                    ? 'Calendar weeks with sugar/mol pricing'
                    : 'Define milling weeks to unlock pricing',
                'progress' => null,
                'accent' => 'indigo',
            ],
            [
                'key' => 'bank_reconciliation',
                'title' => 'Bank Reconciliation',
                'permission' => 'bank_reconciliation.view',
                'href' => '/BankReconciliation',
                'metric' => $recon['total'],
                'metric_label' => 'workspace rows',
                'status' => $recon['outstanding'] > 0 || $recon['unrecorded'] > 0
                    ? 'attention'
                    : ($recon['total'] > 0 ? 'healthy' : 'empty'),
                'status_label' => $recon['matched'].' matched · '.$recon['outstanding'].' outstanding',
                'detail' => $recon['total'] > 0
                    ? round($recon['match_rate']).'% match rate'
                    : 'Import bank statements & disbursements',
                'progress' => $recon['match_rate'],
                'accent' => 'blue',
            ],
            [
                'key' => 'employees',
                'title' => 'Employees',
                'permission' => 'employees.view',
                'href' => '/Employees',
                'metric' => $employeeCount,
                'metric_label' => 'staff',
                'status' => $employeeCount > 0 ? 'healthy' : 'empty',
                'status_label' => $attendanceThisMonth.' attendance this month',
                'detail' => 'HR master list for payroll & attendance',
                'progress' => null,
                'accent' => 'cyan',
            ],
            [
                'key' => 'attendance',
                'title' => 'Attendance',
                'permission' => 'attendance.view',
                'href' => '/Attendance',
                'metric' => $attendanceThisMonth,
                'metric_label' => 'rows this month',
                'status' => $attendanceThisMonth > 0 ? 'healthy' : 'empty',
                'status_label' => Attendance::query()->count().' total records',
                'detail' => 'Feeds payroll generation',
                'progress' => null,
                'accent' => 'orange',
            ],
            [
                'key' => 'payroll',
                'title' => 'Payroll',
                'permission' => 'payroll.view',
                'href' => '/Payroll',
                'metric' => $payrollTotal,
                'metric_label' => 'payrolls',
                'status' => $payrollPending > 0 || $payrollDraft > 0
                    ? 'attention'
                    : ($payrollTotal > 0 ? 'healthy' : 'empty'),
                'status_label' => "{$payrollPaid} paid · {$payrollPending} pending · {$payrollDraft} draft",
                'detail' => $payrollTotal > 0
                    ? round(($payrollPaid / $payrollTotal) * 100).'% paid'
                    : 'Generate payroll from attendance',
                'progress' => $payrollTotal > 0
                    ? round(($payrollPaid / $payrollTotal) * 100)
                    : 0,
                'accent' => 'lime',
            ],
            [
                'key' => 'users',
                'title' => 'Users & Roles',
                'permission' => 'users.view',
                'href' => '/Users',
                'metric' => $userCount,
                'metric_label' => 'accounts',
                'status' => $userCount > 0 ? 'healthy' : 'empty',
                'status_label' => 'Access control',
                'detail' => 'Manage logins, roles, and permissions',
                'progress' => null,
                'accent' => 'gray',
            ],
            [
                'key' => 'imports',
                'title' => 'Imports',
                'permission' => 'planters.import',
                'href' => '/Productions',
                'metric' => $importsRunning,
                'metric_label' => 'in progress',
                'status' => $importsFailed > 0
                    ? 'attention'
                    : ($importsRunning > 0 ? 'busy' : 'healthy'),
                'status_label' => $importsFailed > 0
                    ? "{$importsFailed} failed (7d)"
                    : ($importsRunning > 0 ? 'Jobs running' : 'Queue idle'),
                'detail' => 'Excel / PDF import pipeline health',
                'progress' => null,
                'accent' => 'brown',
            ],
        ];
    }

    /**
     * Progress bars / breakdowns for key workflows.
     *
     * @return array<string, mixed>
     */
    private function buildStatusTracking(?string $cropYear): array
    {
        $productionTotal = Production::query()
            ->when($cropYear, fn ($q) => $q->where('crop_year', $cropYear))
            ->count();
        $productionCompleted = Production::query()
            ->when($cropYear, fn ($q) => $q->where('crop_year', $cropYear))
            ->where('status', 'completed')
            ->count();
        $productionDraft = max(0, $productionTotal - $productionCompleted);

        $payrollPaid = Payroll::query()->where('status', 'paid')->count();
        $payrollPending = Payroll::query()->where('status', 'pending')->count();
        $payrollDraft = Payroll::query()->where('status', 'draft')->count();
        $payrollTotal = $payrollPaid + $payrollPending + $payrollDraft;

        $recon = $this->bankReconSnapshot();

        $imports = [
            'queued' => ImportJob::query()->where('status', ImportJob::STATUS_QUEUED)->count(),
            'running' => ImportJob::query()->where('status', ImportJob::STATUS_RUNNING)->count(),
            'done' => ImportJob::query()
                ->where('status', ImportJob::STATUS_DONE)
                ->where('created_at', '>=', now()->subDays(7))
                ->count(),
            'failed' => ImportJob::query()
                ->where('status', ImportJob::STATUS_FAILED)
                ->where('created_at', '>=', now()->subDays(7))
                ->count(),
        ];

        return [
            'productions' => [
                'total' => $productionTotal,
                'completed' => $productionCompleted,
                'draft' => $productionDraft,
                'percent_complete' => $productionTotal > 0
                    ? round(($productionCompleted / $productionTotal) * 100)
                    : 0,
            ],
            'payroll' => [
                'total' => $payrollTotal,
                'paid' => $payrollPaid,
                'pending' => $payrollPending,
                'draft' => $payrollDraft,
                'percent_paid' => $payrollTotal > 0
                    ? round(($payrollPaid / $payrollTotal) * 100)
                    : 0,
            ],
            'bank_reconciliation' => $recon,
            'imports' => $imports,
        ];
    }

    /**
     * @return list<array{type: string, label: string, status: string, at: string|null, href: string|null}>
     */
    private function buildRecentActivity(): array
    {
        return ImportJob::query()
            ->orderByDesc('updated_at')
            ->limit(8)
            ->get(['id', 'type', 'status', 'file_name', 'message', 'updated_at', 'finished_at'])
            ->map(function (ImportJob $job) {
                $label = $job->file_name
                    ? "{$job->type}: {$job->file_name}"
                    : (string) $job->type;

                return [
                    'type' => (string) $job->type,
                    'label' => $label,
                    'status' => (string) $job->status,
                    'message' => $job->message,
                    'at' => ($job->finished_at ?? $job->updated_at)?->toIso8601String(),
                    'href' => null,
                ];
            })
            ->values()
            ->all();
    }

    /**
     * @return array{
     *     total: int,
     *     matched: int,
     *     outstanding: int,
     *     unrecorded: int,
     *     mismatch: int,
     *     match_rate: float
     * }
     */
    private function bankReconSnapshot(): array
    {
        $empty = [
            'total' => 0,
            'matched' => 0,
            'outstanding' => 0,
            'unrecorded' => 0,
            'mismatch' => 0,
            'match_rate' => 0.0,
        ];

        try {
            if (Schema::hasTable('reconciliation_workspace')) {
                $rows = \App\Models\ReconciliationWorkspace::query()
                    ->selectRaw('status, COUNT(*) as c')
                    ->groupBy('status')
                    ->pluck('c', 'status');

                $matched = (int) ($rows['Matched'] ?? 0);
                $outstanding = (int) ($rows['Outstanding'] ?? 0);
                $unrecorded = (int) ($rows['Unrecorded Bank Entry'] ?? 0);
                $mismatch = (int) ($rows['Amount Mismatch'] ?? 0);
                $total = $matched + $outstanding + $unrecorded + $mismatch;
                $reconcilable = $matched + $outstanding + $mismatch;

                return [
                    'total' => $total,
                    'matched' => $matched,
                    'outstanding' => $outstanding,
                    'unrecorded' => $unrecorded,
                    'mismatch' => $mismatch,
                    'match_rate' => $reconcilable > 0
                        ? round(($matched / $reconcilable) * 100, 1)
                        : 0.0,
                ];
            }

            // Fallback when the workspace view is unavailable.
            $internal = InternalDisbursements::query()->count();
            $bank = BankStatement::query()->count();
            $linked = InternalDisbursements::query()
                ->whereNotNull('bank_statement_id')
                ->count();

            return [
                'total' => $internal + $bank,
                'matched' => $linked,
                'outstanding' => max(0, $internal - $linked),
                'unrecorded' => max(0, $bank - $linked),
                'mismatch' => 0,
                'match_rate' => $internal > 0
                    ? round(($linked / $internal) * 100, 1)
                    : 0.0,
            ];
        } catch (Throwable) {
            return $empty;
        }
    }
}
