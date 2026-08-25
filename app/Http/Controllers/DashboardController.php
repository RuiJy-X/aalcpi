<?php

namespace App\Http\Controllers;

use App\Models\Advancement;
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
use App\Models\ReconciliationWorkspace;
use App\Models\User;
use App\Models\Weekly;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $today = Carbon::today();
        $currentYear = (int) $today->format('Y');
        $currentMonth = (int) $today->format('n');

        // Sugarcane crop year usually starts September (month 9)
        $activeSeasonStart = $currentMonth >= 9 ? $currentYear : $currentYear - 1;
        $calendarCropYears = collect([
            ($activeSeasonStart + 1).'-'.($activeSeasonStart + 2), // Upcoming season (e.g. 2026-2027)
            $activeSeasonStart.'-'.($activeSeasonStart + 1),       // Current active season (e.g. 2025-2026)
            ($activeSeasonStart - 1).'-'.$activeSeasonStart,       // Previous season (e.g. 2024-2025)
            ($activeSeasonStart - 2).'-'.($activeSeasonStart - 1), // Past season (e.g. 2023-2024)
        ]);

        $dbCropYears = collect()
            ->merge(MillingPeriod::query()->whereNotNull('crop_year')->pluck('crop_year'))
            ->merge(Weekly::query()->whereNotNull('crop_year')->pluck('crop_year'))
            ->merge(Production::query()->whereNotNull('crop_year')->pluck('crop_year'))
            ->filter(fn ($cy) => is_string($cy) && trim($cy) !== '')
            ->unique();

        $cropYears = $dbCropYears
            ->merge($calendarCropYears)
            ->unique()
            ->sort(fn ($a, $b) => strnatcasecmp($b, $a))
            ->values();

        $requestedCropYear = $request->input('crop_year');
        $isAllCropYears = $requestedCropYear === 'all';

        // Check if there is an active milling period today
        $activePeriodCY = MillingPeriod::query()
            ->whereDate('start_date', '<=', $today)
            ->whereDate('end_date', '>=', $today)
            ->value('crop_year');

        // Select active crop year, requested crop year, or latest available
        if ($isAllCropYears) {
            $selectedCropYear = 'all';
        } elseif ($requestedCropYear && $cropYears->contains($requestedCropYear)) {
            $selectedCropYear = $requestedCropYear;
        } elseif ($activePeriodCY && $cropYears->contains($activePeriodCY)) {
            $selectedCropYear = $activePeriodCY;
        } elseif ($dbCropYears->isNotEmpty()) {
            $selectedCropYear = $dbCropYears->sort(fn ($a, $b) => strnatcasecmp($b, $a))->first();
        } else {
            $selectedCropYear = $cropYears->first();
        }

        $scopedCropYear = ($selectedCropYear && $selectedCropYear !== 'all') ? $selectedCropYear : null;

        $productionQuery = Production::query()->when(
            $scopedCropYear,
            fn ($query) => $query->where('crop_year', $scopedCropYear),
        );

        $productionTotals = (clone $productionQuery)
            ->selectRaw(
                'COUNT(*) as total_rows,
                 SUM(CASE WHEN status = "draft" THEN 1 ELSE 0 END) as draft_count,
                 SUM(CASE WHEN status = "completed" THEN 1 ELSE 0 END) as completed_count,
                 COALESCE(SUM(gross_cw), 0) as gross_cw,
                 COALESCE(SUM(net_cw), 0) as net_cw,
                 COALESCE(SUM(trucks), 0) as trucks,
                 COALESCE(SUM(actual_lkg), 0) as actual_lkg,
                 COALESCE(SUM(pshr_net_lkg), 0) as pshr_net_lkg,
                 COALESCE(SUM(actual_mol), 0) as actual_mol,
                 COALESCE(SUM(pshr_net_mol), 0) as pshr_net_mol'
            )
            ->first();

        $totalRows = (int) ($productionTotals->total_rows ?? 0);
        $draftCount = (int) ($productionTotals->draft_count ?? 0);
        $completedCount = (int) ($productionTotals->completed_count ?? 0);
        $grossCw = (float) ($productionTotals->gross_cw ?? 0);
        $netCw = (float) ($productionTotals->net_cw ?? 0);
        $trucks = (int) ($productionTotals->trucks ?? 0);
        $actualLkg = (float) ($productionTotals->actual_lkg ?? 0);
        $pshrNetLkg = (float) ($productionTotals->pshr_net_lkg ?? 0);
        $millShareLkg = max(0, $actualLkg - $pshrNetLkg);
        $actualMol = (float) ($productionTotals->actual_mol ?? 0);
        $pshrNetMol = (float) ($productionTotals->pshr_net_mol ?? 0);
        $millShareMol = max(0, $actualMol - $pshrNetMol);
        $percentComplete = $totalRows > 0 ? round(($completedCount / $totalRows) * 100) : 0;

        $productionWorkflow = [
            'total_rows' => $totalRows,
            'draft_count' => $draftCount,
            'completed_count' => $completedCount,
            'percent_complete' => $percentComplete,
            'gross_cw' => $grossCw,
            'net_cw' => $netCw,
            'trucks' => $trucks,
            'actual_lkg' => $actualLkg,
            'pshr_net_lkg' => $pshrNetLkg,
            'mill_share_lkg' => $millShareLkg,
            'actual_mol' => $actualMol,
            'pshr_net_mol' => $pshrNetMol,
            'mill_share_mol' => $millShareMol,
        ];

        $entityCounts = [
            'planters' => (clone $productionQuery)
                ->distinct('planter_code')
                ->count('planter_code'),
            'haciendas' => (clone $productionQuery)
                ->distinct('hacienda_code')
                ->count('hacienda_code'),
        ];

        $trendRows = Production::query()
            ->whereNotNull('crop_year')
            ->selectRaw(
                'crop_year,
                 COUNT(*) as total_rows,
                 COALESCE(SUM(gross_cw), 0) as gross_cw,
                 COALESCE(SUM(net_cw), 0) as net_cw,
                 COALESCE(SUM(trucks), 0) as trucks,
                 COALESCE(SUM(actual_lkg), 0) as actual_lkg,
                 COALESCE(SUM(pshr_net_lkg), 0) as pshr_net_lkg,
                 COALESCE(SUM(actual_mol), 0) as actual_mol,
                 COALESCE(SUM(pshr_net_mol), 0) as pshr_net_mol'
            )
            ->groupBy('crop_year')
            ->orderBy('crop_year', 'asc')
            ->get();

        $trendData = $trendRows->map(function ($row) {
            return [
                'label' => (string) $row->crop_year,
                'period_key' => (string) $row->crop_year,
                'crop_year' => (string) $row->crop_year,
                'total_rows' => (int) $row->total_rows,
                'gross_cw' => (float) $row->gross_cw,
                'net_cw' => (float) $row->net_cw,
                'trucks' => (int) $row->trucks,
                'actual_lkg' => (float) $row->actual_lkg,
                'pshr_net_lkg' => (float) $row->pshr_net_lkg,
                'actual_mol' => (float) $row->actual_mol,
                'pshr_net_mol' => (float) $row->pshr_net_mol,
            ];
        })->values();

        $planterLeaderboard = Production::query()
            ->join('planters', 'productions.planter_id', '=', 'planters.id')
            ->leftJoin('haciendas', 'productions.hacienda_id', '=', 'haciendas.id')
            ->when(
                $scopedCropYear,
                fn ($query) => $query->where('productions.crop_year', $scopedCropYear),
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
                $scopedCropYear,
                fn ($query) => $query->where('crop_year', $scopedCropYear),
            )
            ->orderBy('week_no')
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

        $activeMillingPeriod = MillingPeriod::query()
            ->when($scopedCropYear, fn ($q) => $q->where('crop_year', $scopedCropYear))
            ->whereDate('start_date', '<=', $today)
            ->whereDate('end_date', '>=', $today)
            ->first([
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

        if (! $activeMillingPeriod && $millingPeriods->isNotEmpty()) {
            $activeMillingPeriod = $millingPeriods->first();
        }

        $cropYearDateRange = $this->resolveCropYearDateRange($scopedCropYear);

        // Bank Reconciliation detailed metrics (filtered by internal date_issued within crop year)
        $unmatchedDisbursements = InternalDisbursements::query()
            ->whereNull('bank_statement_id')
            ->when($cropYearDateRange, function ($query) use ($cropYearDateRange) {
                $query->where(function ($q) use ($cropYearDateRange) {
                    $q->whereBetween('date_issued', [$cropYearDateRange['start'], $cropYearDateRange['end']])
                        ->orWhere(function ($fallback) use ($cropYearDateRange) {
                            $fallback->whereNull('date_issued')
                                ->whereBetween('created_at', [
                                    $cropYearDateRange['start'].' 00:00:00',
                                    $cropYearDateRange['end'].' 23:59:59',
                                ]);
                        });
                });
            });

        $outstandingChecksCount = $unmatchedDisbursements->count();
        $outstandingChecksAmount = (float) $unmatchedDisbursements->sum('check_amount');

        $unmatchedBankEntries = BankStatement::query()
            ->whereDoesntHave('internalDisbursement')
            ->when($cropYearDateRange, function ($query) use ($cropYearDateRange) {
                $query->whereBetween('transaction_date', [$cropYearDateRange['start'], $cropYearDateRange['end']]);
            });

        $unrecordedBankCount = $unmatchedBankEntries->count();
        $unrecordedBankAmount = (float) $unmatchedBankEntries->sum('debit');

        $reconSnapshot = $this->bankReconSnapshot($cropYearDateRange);
        $bankReconWorkflow = [
            'total' => $reconSnapshot['total'],
            'matched_count' => $reconSnapshot['matched'],
            'match_rate' => $reconSnapshot['match_rate'],
            'outstanding_count' => $outstandingChecksCount,
            'outstanding_amount' => $outstandingChecksAmount,
            'unrecorded_count' => $unrecordedBankCount,
            'unrecorded_amount' => $unrecordedBankAmount,
            'mismatch_count' => $reconSnapshot['mismatch'],
        ];

        // Payroll detailed metrics
        $payrollDraftCount = Payroll::query()->where('status', 'draft')->count();
        $payrollDraftAmount = (float) Payroll::query()->where('status', 'draft')->sum('net_pay');

        $payrollPendingCount = Payroll::query()->where('status', 'pending')->count();
        $payrollPendingAmount = (float) Payroll::query()->where('status', 'pending')->sum('net_pay');

        $payrollPaidCount = Payroll::query()->where('status', 'paid')->count();
        $payrollPaidAmount = (float) Payroll::query()->where('status', 'paid')->sum('net_pay');

        $attendanceThisMonth = Attendance::query()
            ->whereBetween('date', [
                $today->copy()->startOfMonth()->toDateString(),
                $today->copy()->endOfMonth()->toDateString(),
            ])
            ->count();

        $activeAdvanceBalance = (float) Advancement::query()
            ->whereIn('status', ['paid_out', 'partially_deducted'])
            ->sum('remaining_balance');

        $payrollWorkflow = [
            'total_count' => $payrollDraftCount + $payrollPendingCount + $payrollPaidCount,
            'draft_count' => $payrollDraftCount,
            'draft_amount' => $payrollDraftAmount,
            'pending_count' => $payrollPendingCount,
            'pending_amount' => $payrollPendingAmount,
            'paid_count' => $payrollPaidCount,
            'paid_amount' => $payrollPaidAmount,
            'attendance_this_month' => $attendanceThisMonth,
            'active_advance_balance' => $activeAdvanceBalance,
        ];

        $failedImportsCount = ImportJob::query()
            ->where('status', ImportJob::STATUS_FAILED)
            ->where('created_at', '>=', now()->subDays(7))
            ->count();

        $actionQueue = [
            [
                'id' => 'failed_imports',
                'permission' => 'import_history.view',
                'level' => 'critical',
                'count' => $failedImportsCount,
                'amount' => null,
                'title' => 'Failed Ingestion Jobs',
                'description' => "{$failedImportsCount} file import error(s) in the last 7 days",
                'action_label' => 'Inspect Logs',
                'href' => '/Imports/history',
            ],
            [
                'id' => 'draft_productions',
                'permission' => 'productions.view',
                'level' => 'info',
                'count' => $draftCount,
                'amount' => null,
                'title' => 'Draft Production Rows',
                'description' => "{$draftCount} production row(s) pending final review",
                'action_label' => 'Review Productions',
                'href' => '/Productions',
            ],
            [
                'id' => 'pending_payrolls',
                'permission' => 'payroll.view',
                'level' => 'info',
                'count' => $payrollPendingCount,
                'amount' => $payrollPendingAmount,
                'title' => 'Pending Payroll Batches',
                'description' => "{$payrollPendingCount} payroll batch(es) awaiting manager approval (₱".number_format($payrollPendingAmount, 2).')',
                'action_label' => 'Approve Payroll',
                'href' => '/Payroll',
            ],
        ];

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
            'production_workflow' => $productionWorkflow,
            'bank_recon_workflow' => $bankReconWorkflow,
            'payroll_workflow' => $payrollWorkflow,
            'active_milling_period' => $activeMillingPeriod,
            'action_queue' => $actionQueue,
            'module_summaries' => $this->buildModuleSummaries($scopedCropYear),
            'status_tracking' => $this->buildStatusTracking($scopedCropYear),
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

        $cropYearDateRange = $this->resolveCropYearDateRange($cropYear);
        $recon = $this->bankReconSnapshot($cropYearDateRange);

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

        $cropYearDateRange = $this->resolveCropYearDateRange($cropYear);
        $recon = $this->bankReconSnapshot($cropYearDateRange);

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
     * Resolve start and end dates for a given crop year (e.g. '2025-2026').
     *
     * @return array{start: string, end: string}|null
     */
    private function resolveCropYearDateRange(?string $cropYear): ?array
    {
        if (! $cropYear || $cropYear === 'all') {
            return null;
        }

        $startDate = null;
        $endDate = null;

        // Parse YYYY-YYYY format
        if (preg_match('/^(\d{4})-(\d{4})$/', $cropYear, $matches)) {
            $startYear = (int) $matches[1];
            $endYear = (int) $matches[2];
            // Default sugarcane crop year season: Sept 1 to August 31
            $startDate = Carbon::createFromDate($startYear, 9, 1)->toDateString();
            $endDate = Carbon::createFromDate($endYear, 8, 31)->toDateString();
        }

        // Expand with actual defined milling period dates if they extend beyond standard bounds
        $minMillingStart = MillingPeriod::query()->where('crop_year', $cropYear)->whereNotNull('start_date')->min('start_date');
        $maxMillingEnd = MillingPeriod::query()->where('crop_year', $cropYear)->whereNotNull('end_date')->max('end_date');

        if ($minMillingStart) {
            $startDate = $startDate ? min($startDate, $minMillingStart) : $minMillingStart;
        }

        if ($maxMillingEnd) {
            $endDate = $endDate ? max($endDate, $maxMillingEnd) : $maxMillingEnd;
        }

        if ($startDate && $endDate) {
            return ['start' => $startDate, 'end' => $endDate];
        }

        return null;
    }

    /**
     * @param  array{start: string, end: string}|null  $cropYearDateRange
     * @return array{
     *     total: int,
     *     matched: int,
     *     outstanding: int,
     *     unrecorded: int,
     *     mismatch: int,
     *     match_rate: float
     * }
     */
    private function bankReconSnapshot(?array $cropYearDateRange = null): array
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
                $query = ReconciliationWorkspace::query();

                if ($cropYearDateRange) {
                    $query->where(function ($q) use ($cropYearDateRange) {
                        $q->whereBetween('internal_date_issued', [$cropYearDateRange['start'], $cropYearDateRange['end']])
                            ->orWhereBetween('transaction_date', [$cropYearDateRange['start'], $cropYearDateRange['end']]);
                    });
                }

                $rows = $query->selectRaw('status, COUNT(*) as c')
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
            $internalQuery = InternalDisbursements::query()
                ->when($cropYearDateRange, function ($query) use ($cropYearDateRange) {
                    $query->where(function ($q) use ($cropYearDateRange) {
                        $q->whereBetween('date_issued', [$cropYearDateRange['start'], $cropYearDateRange['end']])
                            ->orWhere(function ($fallback) use ($cropYearDateRange) {
                                $fallback->whereNull('date_issued')
                                    ->whereBetween('created_at', [
                                        $cropYearDateRange['start'].' 00:00:00',
                                        $cropYearDateRange['end'].' 23:59:59',
                                    ]);
                            });
                    });
                });

            $bankQuery = BankStatement::query()
                ->when($cropYearDateRange, function ($query) use ($cropYearDateRange) {
                    $query->whereBetween('transaction_date', [$cropYearDateRange['start'], $cropYearDateRange['end']]);
                });

            $internal = $internalQuery->count();
            $bank = $bankQuery->count();
            $linked = (clone $internalQuery)
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
