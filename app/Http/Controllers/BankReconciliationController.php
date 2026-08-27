<?php

namespace App\Http\Controllers;

use App\Exports\BankReconciliationExport;
use App\Models\BankStatement;
use App\Models\InternalDisbursements;
use App\Models\ReconciliationWorkspace;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class BankReconciliationController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $perPageInput = $request->input('per_page', 10);
        $showAll = in_array($perPageInput, ['all', -1, '-1'], true);
        $perPage = $showAll ? null : min(max(1, (int) $perPageInput), 100);

        $sort = $request->string('sort')->toString();
        $direction = strtolower($request->string('direction')->toString()) === 'asc' ? 'asc' : 'desc';
        $search = $request->string('search')->toString();
        $filters = $request->input('filters', []);
        $dateColumn = $request->string('date_column')->toString();
        $dateFrom = $request->string('date_from')->toString();
        $dateTo = $request->string('date_to')->toString();

        // Period filter: independent of the generic single-column date range above.
        // Matches a row if EITHER internal_date_issued OR transaction_date falls
        // inside the selected range.
        $periodFrom = $request->string('period_from')->toString();
        $periodTo = $request->string('period_to')->toString();

        $driver = Schema::getConnection()->getDriverName();
        $likeOperator = $driver === 'pgsql' ? 'ilike' : 'like';
        $useCaseInsensitiveLike = $driver === 'sqlite';
        $applyLike = function ($query, string $column, string $value, string $boolean = 'and') use ($likeOperator, $useCaseInsensitiveLike) {
            if ($useCaseInsensitiveLike) {
                $grammar = method_exists($query, 'getQuery') ? $query->getQuery()->getGrammar() : $query->getGrammar();
                $wrapped = $grammar->wrap($column);
                $query->whereRaw('lower('.$wrapped.') like ?', [strtolower($value)], $boolean);

                return;
            }

            $query->where($column, $likeOperator, $value, $boolean);
        };

        $columnMap = [
            'ref_no' => 'reconciliation_workspace.ref_no',
            'description' => 'reconciliation_workspace.description',
            'status' => 'reconciliation_workspace.status',
            'transaction_date' => 'reconciliation_workspace.transaction_date',
            'created_at' => 'reconciliation_workspace.created_at',
            'updated_at' => 'reconciliation_workspace.updated_at',
            'source' => 'reconciliation_workspace.source',
            'internal_source' => 'reconciliation_workspace.internal_source',
            'variance' => 'reconciliation_workspace.variance',
            'days_outstanding' => 'reconciliation_workspace.days_outstanding',
            'disbursement_week' => 'reconciliation_workspace.disbursement_week',
            'internal_date_issued' => 'reconciliation_workspace.internal_date_issued',
            'debit' => 'reconciliation_workspace.debit',
            'is_duplicate' => 'reconciliation_workspace.is_duplicate',
            'internal_amount' => 'reconciliation_workspace.internal_amount',
        ];

        $baseQuery = ReconciliationWorkspace::query();

        if ($request->filled('status') && ! array_key_exists('status', $filters)) {
            $filters['status'] = $request->input('status');
        }

        if ($request->filled('disbursement_week') && ! array_key_exists('disbursement_week', $filters)) {
            $filters['disbursement_week'] = $request->input('disbursement_week');
        }
        if ($request->filled('is_duplicate') && ! array_key_exists('is_duplicate', $filters)) {
            $filters['is_duplicate'] = $request->input('is_duplicate');
        }

        if (! empty($filters) && is_array($filters)) {
            foreach ($filters as $column => $value) {
                if (! array_key_exists($column, $columnMap)) {
                    continue;
                }

                if ($value === '' || $value === null) {
                    continue;
                }

                $dbColumn = $columnMap[$column];
                $values = is_array($value) ? $value : [$value];

                $isExactMatch = in_array($column, ['disbursement_week', 'is_duplicate'], true);

                $baseQuery->where(function ($query) use ($applyLike, $dbColumn, $values, $isExactMatch) {
                    foreach ($values as $filterValue) {
                        if ($filterValue === '' || $filterValue === null) {
                            continue;
                        }

                        if ($isExactMatch) {
                            $query->orWhere($dbColumn, $filterValue);
                        } else {
                            $applyLike($query, $dbColumn, '%'.$filterValue.'%', 'or');
                        }
                    }
                });
            }
        }

        if ($search !== '') {
            $like = '%'.$search.'%';
            $baseQuery->where(function ($query) use ($applyLike, $like) {
                $applyLike($query, 'reconciliation_workspace.ref_no', $like, 'or');
                $applyLike($query, 'reconciliation_workspace.description', $like, 'or');
            });
        }

        if ($dateColumn !== '' && isset($columnMap[$dateColumn]) && $dateFrom !== '') {
            $dbDateColumn = $columnMap[$dateColumn];
            $toDate = $dateTo !== '' ? $dateTo : $dateFrom;
            $baseQuery->whereBetween($dbDateColumn, [$dateFrom, $toDate]);
        }

        if ($periodFrom !== '') {
            $periodToResolved = $periodTo !== '' ? $periodTo : $periodFrom;
            $baseQuery->where(function ($query) use ($periodFrom, $periodToResolved) {
                $query->whereBetween('reconciliation_workspace.internal_date_issued', [$periodFrom, $periodToResolved])
                    ->orWhereBetween('reconciliation_workspace.transaction_date', [$periodFrom, $periodToResolved]);
            });
        }

        if ($sort !== '' && isset($columnMap[$sort])) {
            $baseQuery->orderBy($columnMap[$sort], $direction);
        } else {
            $baseQuery->orderBy('reconciliation_workspace.transaction_date', 'desc');
        }

        $statusOptions = ['Amount Mismatch', 'Matched', 'Outstanding', 'Unrecorded Bank Entry'];

        Cache::forget('bank_recon_week_options');

        $weekOptions = InternalDisbursements::query()
            ->whereNotNull('disbursement_week')
            ->distinct()
            ->orderBy('disbursement_week')
            ->pluck('disbursement_week');

        $kpiStats = $this->buildKpiStats($periodFrom, $periodTo);
        $fileAuditStats = $this->buildFileAuditStats($periodFrom, $periodTo, $filters);

        if ($showAll) {
            $allWorkspaces = $baseQuery->get();

            return Inertia::render('BankReconciliation/Index', [
                'reconciliationWorkspaces' => $allWorkspaces,
                'pagination' => [
                    'total' => $allWorkspaces->count(),
                    'per_page' => $allWorkspaces->count(),
                    'current_page' => 1,
                    'last_page' => 1,
                ],
                'table_state' => [
                    'search' => $search,
                    'sort' => $sort,
                    'direction' => $direction,
                    'filters' => $filters,
                    'date_column' => $dateColumn,
                    'date_from' => $dateFrom,
                    'date_to' => $dateTo,
                    'period_from' => $periodFrom,
                    'period_to' => $periodTo,
                    'per_page' => 'all',
                ],
                'statuses' => $statusOptions,
                'weekOptions' => $weekOptions,
                'kpiStats' => $kpiStats,
                'fileAuditStats' => $fileAuditStats,
            ]);
        }

        // Single aggregate query for total count and sum totals
        $summary = (clone $baseQuery)->reorder()->selectRaw('
            COUNT(*) as total_count,
            COALESCE(SUM(internal_amount), 0) as internal_total,
            COALESCE(SUM(bank_amount), 0) as bank_total
        ')->first();

        $totalCount = (int) ($summary->total_count ?? 0);

        $summaryStats = [
            'total_count' => $totalCount,
            'internal_total' => (float) ($summary->internal_total ?? 0),
            'bank_total' => (float) ($summary->bank_total ?? 0),
        ];

        $page = (int) $request->input('page', 1);
        $workspaces = (clone $baseQuery)->forPage($page, $perPage)->get();

        return Inertia::render('BankReconciliation/Index', [
            'reconciliationWorkspaces' => $workspaces,
            'pagination' => [
                'total' => $totalCount,
                'per_page' => $perPage,
                'current_page' => $page,
                'last_page' => (int) ceil($totalCount / max(1, $perPage)),
            ],
            'table_state' => [
                'search' => $search,
                'sort' => $sort,
                'direction' => $direction,
                'filters' => $filters,
                'date_column' => $dateColumn,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
                'period_from' => $periodFrom,
                'period_to' => $periodTo,
            ],
            'statuses' => $statusOptions,
            'weekOptions' => $weekOptions,
            'summaryStats' => $summaryStats,
            'kpiStats' => $kpiStats,
            'fileAuditStats' => $fileAuditStats,
        ]);
    }

    /**
     * Build file audit stats for bank reconciliation.
     * Business rule: 1 Monthly Bank Statement file + 4 Weekly Summary Ledgers per month (Weeks 1 to 4).
     */
    private function buildFileAuditStats(string $periodFrom, string $periodTo, array $filters = []): array
    {
        $hasDateFilter = $periodFrom !== '';
        $referenceDate = $hasDateFilter ? Carbon::parse($periodFrom) : Carbon::now();
        $targetMonthStr = $referenceDate->format('Y-m');
        $monthStart = $referenceDate->copy()->startOfMonth()->toDateString();
        $monthEnd = $referenceDate->copy()->endOfMonth()->toDateString();
        $periodToResolved = $periodTo !== '' ? $periodTo : ($hasDateFilter ? $periodFrom : $monthEnd);

        $periodLabel = $hasDateFilter
            ? ($periodFrom === $monthStart && ($periodTo === '' || $periodTo === $monthEnd)
                ? $referenceDate->format('F Y')
                : $referenceDate->format('M d, Y').($periodTo !== '' && $periodTo !== $periodFrom ? ' – '.Carbon::parse($periodTo)->format('M d, Y') : ''))
            : 'All Dates (Showing '.$referenceDate->format('F Y').' Cycle)';

        // 1. Audit Bank Statement (1 file expected per month)
        $bankJobQuery = DB::table('bank_statements')
            ->leftJoin('import_jobs', 'import_jobs.id', '=', 'bank_statements.import_job_id')
            ->where(function ($q) use ($monthStart, $monthEnd, $periodFrom, $periodToResolved, $hasDateFilter) {
                if ($hasDateFilter) {
                    $q->whereBetween('bank_statements.bank_date', [$monthStart, $monthEnd])
                        ->orWhereBetween('bank_statements.tdate', [$periodFrom, $periodToResolved]);
                } else {
                    $q->whereBetween('bank_statements.bank_date', [$monthStart, $monthEnd]);
                }
            })
            ->select([
                DB::raw('COALESCE(import_jobs.file_name, \'Bank Statement\') as file_name'),
                'import_jobs.id as import_job_id',
                'import_jobs.created_at as uploaded_at',
                DB::raw('COUNT(bank_statements.id) as record_count'),
                DB::raw('COALESCE(SUM(bank_statements.debit), 0) as total_debit'),
            ])
            ->groupBy('import_jobs.id', 'import_jobs.file_name', 'import_jobs.created_at')
            ->first();

        $bankFileStatus = [
            'status' => $bankJobQuery && (int) $bankJobQuery->record_count > 0 ? 'imported' : 'missing',
            'month' => $referenceDate->format('F Y'),
            'month_key' => $targetMonthStr,
            'file_name' => $bankJobQuery->file_name ?? null,
            'import_job_id' => $bankJobQuery->import_job_id ?? null,
            'record_count' => (int) ($bankJobQuery->record_count ?? 0),
            'total_debit' => (float) ($bankJobQuery->total_debit ?? 0),
            'uploaded_at' => ! empty($bankJobQuery->uploaded_at) ? Carbon::parse($bankJobQuery->uploaded_at)->format('M d, Y h:i A') : null,
        ];

        // 2. Audit Weekly Summary Ledgers (4 files expected per month: Weeks 1, 2, 3, 4)
        $weeklyLedgersQuery = DB::table('internal_disbursements')
            ->leftJoin('import_jobs', 'import_jobs.id', '=', 'internal_disbursements.import_job_id')
            ->whereNotNull('internal_disbursements.disbursement_week')
            ->where(function ($q) use ($monthStart, $monthEnd, $periodFrom, $periodToResolved, $hasDateFilter) {
                if ($hasDateFilter) {
                    $q->whereBetween('internal_disbursements.date_issued', [$periodFrom, $periodToResolved]);
                } else {
                    $q->whereBetween('internal_disbursements.date_issued', [$monthStart, $monthEnd]);
                }
            })
            ->select([
                'internal_disbursements.disbursement_week as week',
                DB::raw('COALESCE(import_jobs.file_name, \'Summary Ledger\') as file_name'),
                'import_jobs.id as import_job_id',
                'import_jobs.created_at as uploaded_at',
                DB::raw('MIN(internal_disbursements.date_issued) as date_issued'),
                DB::raw('COUNT(internal_disbursements.id) as record_count'),
                DB::raw('COALESCE(SUM(internal_disbursements.check_amount), 0) as total_amount'),
            ])
            ->groupBy('internal_disbursements.disbursement_week', 'import_jobs.id', 'import_jobs.file_name', 'import_jobs.created_at')
            ->get()
            ->keyBy('week');

        $expectedWeeks = [1, 2, 3, 4];
        $detectedWeeks = $weeklyLedgersQuery->keys()->map(fn ($w) => (int) $w)->all();
        foreach ($detectedWeeks as $w) {
            if ($w >= 5 && ! in_array($w, $expectedWeeks, true)) {
                $expectedWeeks[] = $w;
            }
        }
        sort($expectedWeeks);

        $weeklyLedgers = [];
        $importedWeeksCount = 0;
        $missingWeeks = [];

        foreach ($expectedWeeks as $week) {
            $ledger = $weeklyLedgersQuery->get($week);
            if ($ledger && (int) $ledger->record_count > 0) {
                $importedWeeksCount++;
                $weeklyLedgers[] = [
                    'week' => $week,
                    'status' => 'imported',
                    'file_name' => $ledger->file_name,
                    'import_job_id' => $ledger->import_job_id,
                    'date_issued' => $ledger->date_issued ? Carbon::parse($ledger->date_issued)->format('M d, Y') : null,
                    'record_count' => (int) $ledger->record_count,
                    'total_amount' => (float) $ledger->total_amount,
                    'uploaded_at' => ! empty($ledger->uploaded_at) ? Carbon::parse($ledger->uploaded_at)->format('M d, Y h:i A') : null,
                ];
            } else {
                $missingWeeks[] = $week;
                $weeklyLedgers[] = [
                    'week' => $week,
                    'status' => 'missing',
                    'file_name' => null,
                    'import_job_id' => null,
                    'date_issued' => null,
                    'record_count' => 0,
                    'total_amount' => 0.0,
                    'uploaded_at' => null,
                ];
            }
        }

        $totalExpected = 1 + count($expectedWeeks);
        $totalImported = ($bankFileStatus['status'] === 'imported' ? 1 : 0) + $importedWeeksCount;
        $missingFilesCount = max(0, $totalExpected - $totalImported);

        return [
            'has_date_filter' => $hasDateFilter,
            'target_month' => $targetMonthStr,
            'month_label' => $referenceDate->format('F Y'),
            'period_label' => $periodLabel,
            'period_from' => $hasDateFilter ? $periodFrom : $monthStart,
            'period_to' => $hasDateFilter ? $periodToResolved : $monthEnd,
            'bank_file' => $bankFileStatus,
            'weekly_ledgers' => $weeklyLedgers,
            'expected_weeks' => $expectedWeeks,
            'missing_weeks' => $missingWeeks,
            'imported_weeks_count' => $importedWeeksCount,
            'total_expected_files' => $totalExpected,
            'total_imported_files' => $totalImported,
            'missing_files_count' => $missingFilesCount,
            'is_complete' => $missingFilesCount === 0,
        ];
    }

    /**
     * Single-pass KPI aggregate calculation.
     * Uses direct indexed base table queries for default view to achieve sub-millisecond speed.
     */
    private function buildKpiStats(string $periodFrom, string $periodTo): array
    {
        if ($periodFrom !== '') {
            $periodToResolved = $periodTo !== '' ? $periodTo : $periodFrom;
            $query = ReconciliationWorkspace::query();
            $query->where(function ($q) use ($periodFrom, $periodToResolved) {
                $q->whereBetween('reconciliation_workspace.internal_date_issued', [$periodFrom, $periodToResolved])
                    ->orWhereBetween('reconciliation_workspace.transaction_date', [$periodFrom, $periodToResolved]);
            });

            $stats = $query->reorder()->selectRaw("
                COUNT(CASE WHEN status = 'Matched' THEN 1 END) as matched,
                COUNT(CASE WHEN status = 'Outstanding' THEN 1 END) as outstanding,
                COUNT(CASE WHEN status = 'Amount Mismatch' THEN 1 END) as mismatched,
                COUNT(CASE WHEN status = 'Unrecorded Bank Entry' THEN 1 END) as unrecorded,
                COUNT(CASE WHEN is_duplicate THEN 1 END) as duplicates
            ")->first();

            return [
                'matched' => (int) ($stats->matched ?? 0),
                'outstanding' => (int) ($stats->outstanding ?? 0),
                'mismatched' => (int) ($stats->mismatched ?? 0),
                'unrecorded' => (int) ($stats->unrecorded ?? 0),
                'duplicates' => (int) ($stats->duplicates ?? 0),
            ];
        }

        $matched = DB::table('internal_disbursements')
            ->join('bank_statements', 'bank_statements.id', '=', 'internal_disbursements.bank_statement_id')
            ->whereRaw('internal_disbursements.check_amount = bank_statements.debit')
            ->count();

        $mismatched = DB::table('internal_disbursements')
            ->join('bank_statements', 'bank_statements.id', '=', 'internal_disbursements.bank_statement_id')
            ->whereRaw('internal_disbursements.check_amount != bank_statements.debit')
            ->count();

        $outstanding = DB::table('internal_disbursements')
            ->whereNull('bank_statement_id')
            ->count();

        $unrecorded = DB::table('bank_statements')
            ->whereNotIn('id', function ($q) {
                $q->select('bank_statement_id')->from('internal_disbursements')->whereNotNull('bank_statement_id');
            })
            ->count();

        $internalDuplicates = DB::table('internal_disbursements')->where('is_duplicate', true)->count();
        $bankDuplicates = DB::table('bank_statements')
            ->where('is_duplicate', true)
            ->whereNotIn('id', function ($q) {
                $q->select('bank_statement_id')->from('internal_disbursements')->whereNotNull('bank_statement_id');
            })
            ->count();

        return [
            'matched' => $matched,
            'outstanding' => $outstanding,
            'mismatched' => $mismatched,
            'unrecorded' => $unrecorded,
            'duplicates' => $internalDuplicates + $bankDuplicates,
        ];
    }

    public function create()
    {
        //
    }

    public function store(Request $request)
    {
        //
    }

    public function show(string $id)
    {
        //
    }

    public function edit(string $id)
    {
        //
    }

    public function update(Request $request, string $id)
    {
        //
    }

    public function destroy(string $id)
    {
        //
    }

    public function bulkDestroy(Request $request)
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['required', 'string'],
        ]);

        $internalIds = [];
        $bankIds = [];

        foreach ($validated['ids'] as $compositeId) {
            [$source, $sourceId] = array_pad(explode(':', $compositeId, 2), 2, null);

            if (! is_numeric($sourceId)) {
                continue;
            }

            if ($source === 'internal') {
                $internalIds[] = (int) $sourceId;
            } elseif ($source === 'bank') {
                $bankIds[] = (int) $sourceId;
            }
        }

        if (empty($internalIds) && empty($bankIds)) {
            return redirect()->back()->with('error', 'No valid records selected.');
        }

        if (! empty($internalIds)) {
            $linkedBankIds = InternalDisbursements::whereIn('id', $internalIds)
                ->whereNotNull('bank_statement_id')
                ->pluck('bank_statement_id')
                ->filter()
                ->values()
                ->toArray();

            $bankIds = array_values(array_unique(array_merge($bankIds, $linkedBankIds)));

            InternalDisbursements::whereIn('id', $internalIds)->delete();
            Cache::forget('bank_recon_week_options');
        }

        if (! empty($bankIds)) {
            BankStatement::whereIn('id', $bankIds)->delete();
        }

        return redirect()->back()->with('success', 'Selected reconciliation records deleted successfully.');
    }

    private function buildFilteredQuery(Request $request)
    {
        $search = $request->string('search')->toString();
        $filters = $request->input('filters', []);
        $dateColumn = $request->string('date_column')->toString();
        $dateFrom = $request->string('date_from')->toString();
        $dateTo = $request->string('date_to')->toString();
        $periodFrom = $request->string('period_from')->toString();
        $periodTo = $request->string('period_to')->toString();
        $driver = Schema::getConnection()->getDriverName();
        $likeOperator = $driver === 'pgsql' ? 'ilike' : 'like';
        $useCaseInsensitiveLike = $driver === 'sqlite';

        $applyLike = function ($query, string $column, string $value, string $boolean = 'and') use ($likeOperator, $useCaseInsensitiveLike) {
            if ($useCaseInsensitiveLike) {
                $grammar = method_exists($query, 'getQuery') ? $query->getQuery()->getGrammar() : $query->getGrammar();
                $wrapped = $grammar->wrap($column);
                $query->whereRaw('lower('.$wrapped.') like ?', [strtolower($value)], $boolean);

                return;
            }
            $query->where($column, $likeOperator, $value, $boolean);
        };

        $columnMap = [
            'ref_no' => 'reconciliation_workspace.ref_no',
            'description' => 'reconciliation_workspace.description',
            'status' => 'reconciliation_workspace.status',
            'transaction_date' => 'reconciliation_workspace.transaction_date',
            'created_at' => 'reconciliation_workspace.created_at',
            'updated_at' => 'reconciliation_workspace.updated_at',
            'internal_source' => 'reconciliation_workspace.internal_source',
            'variance' => 'reconciliation_workspace.variance',
            'days_outstanding' => 'reconciliation_workspace.days_outstanding',
            'disbursement_week' => 'reconciliation_workspace.disbursement_week',
            'is_duplicate' => 'reconciliation_workspace.is_duplicate',
            'internal_date_issued' => 'reconciliation_workspace.internal_date_issued',
        ];

        $query = ReconciliationWorkspace::query();

        if ($request->filled('status') && ! array_key_exists('status', $filters)) {
            $filters['status'] = $request->input('status');
        }

        if ($request->filled('disbursement_week') && ! array_key_exists('disbursement_week', $filters)) {
            $filters['disbursement_week'] = $request->input('disbursement_week');
        }

        if (! empty($filters) && is_array($filters)) {
            foreach ($filters as $column => $value) {
                if (! array_key_exists($column, $columnMap) || $value === '' || $value === null) {
                    continue;
                }
                $dbColumn = $columnMap[$column];
                $values = is_array($value) ? $value : [$value];
                $isExactMatch = in_array($column, ['disbursement_week', 'is_duplicate'], true);

                $query->where(function ($q) use ($applyLike, $dbColumn, $values, $isExactMatch) {
                    foreach ($values as $filterValue) {
                        if ($filterValue === '' || $filterValue === null) {
                            continue;
                        }
                        if ($isExactMatch) {
                            $q->orWhere($dbColumn, $filterValue);
                        } else {
                            $applyLike($q, $dbColumn, '%'.$filterValue.'%', 'or');
                        }
                    }
                });
            }
        }

        if ($search !== '') {
            $like = '%'.$search.'%';
            $query->where(function ($q) use ($applyLike, $like) {
                $applyLike($q, 'reconciliation_workspace.ref_no', $like, 'or');
                $applyLike($q, 'reconciliation_workspace.description', $like, 'or');
            });
        }

        if ($dateColumn !== '' && isset($columnMap[$dateColumn]) && $dateFrom !== '') {
            $dbDateColumn = $columnMap[$dateColumn];
            $toDate = $dateTo !== '' ? $dateTo : $dateFrom;
            $query->whereBetween($dbDateColumn, [$dateFrom, $toDate]);
        }

        if ($periodFrom !== '') {
            $periodToResolved = $periodTo !== '' ? $periodTo : $periodFrom;
            $query->where(function ($q) use ($periodFrom, $periodToResolved) {
                $q->whereBetween('reconciliation_workspace.internal_date_issued', [$periodFrom, $periodToResolved])
                    ->orWhereBetween('reconciliation_workspace.transaction_date', [$periodFrom, $periodToResolved]);
            });
        }

        return $query;
    }

    public function clear(Request $request)
    {
        $filteredQuery = $this->buildFilteredQuery($request);
        $matches = $filteredQuery->get(['source', 'source_id']);

        $internalIds = $matches->where('source', 'internal')->pluck('source_id')->toArray();
        $unrecordedBankIds = $matches->where('source', 'bank')->pluck('source_id')->toArray();

        $linkedBankIds = [];
        if (! empty($internalIds)) {
            $linkedBankIds = InternalDisbursements::whereIn('id', $internalIds)
                ->whereNotNull('bank_statement_id')
                ->pluck('bank_statement_id')
                ->filter()
                ->values()
                ->toArray();
        }

        $bankIds = array_values(array_unique(array_merge($unrecordedBankIds, $linkedBankIds)));

        if (! empty($internalIds)) {
            InternalDisbursements::whereIn('id', $internalIds)->delete();
        }

        if (! empty($bankIds)) {
            BankStatement::whereIn('id', $bankIds)->delete();
        }

        return redirect()->back()->with('success', 'All matching reconciliation records have been cleared.');
    }

    /**
     * Build the structured dataset for outstanding checks grouped by month.
     * Uses DB query builder and explicit column selection to minimize memory usage for large datasets (e.g. 2000+ records).
     */
    private function buildOutstandingChecksData(Request $request): array
    {
        @ini_set('memory_limit', '512M');
        @set_time_limit(300);

        $dateFrom = $request->string('date_from')->toString();
        $dateTo = $request->string('date_to')->toString();

        $query = DB::table('reconciliation_workspace')
            ->select([
                'ref_no',
                'description',
                'internal_amount',
                'internal_date_issued',
            ])
            ->where('status', 'Outstanding');

        if ($dateFrom !== '') {
            $dateToResolved = $dateTo !== '' ? $dateTo : $dateFrom;
            $query->whereBetween('internal_date_issued', [$dateFrom, $dateToResolved]);
        }

        $records = $query->orderBy('internal_date_issued', 'asc')
            ->orderBy('ref_no', 'asc')
            ->get();

        $grouped = [];
        foreach ($records as $record) {
            $rawDate = $record->internal_date_issued;
            $dateObj = $rawDate ? Carbon::parse($rawDate) : null;
            $monthKey = $dateObj ? $dateObj->format('Y-m') : 'Unknown';
            $monthLabel = $dateObj ? $dateObj->format('F Y') : 'Unknown Date';

            if (! isset($grouped[$monthKey])) {
                $grouped[$monthKey] = [
                    'month_key' => $monthKey,
                    'month_label' => $monthLabel,
                    'items' => [],
                    'subtotal' => 0,
                ];
            }

            $itemNo = count($grouped[$monthKey]['items']) + 1;
            $amount = (float) ($record->internal_amount ?? 0);

            $grouped[$monthKey]['items'][] = [
                'no' => $itemNo,
                'date' => $dateObj ? $dateObj->format('m/d/Y') : '',
                'raw_date' => $rawDate ? (string) $rawDate : '',
                'payee_name' => $record->description ?? '',
                'check_no' => $record->ref_no ?? '',
                'amount' => $amount,
                'date_cleared' => '',
            ];

            $grouped[$monthKey]['subtotal'] += $amount;
        }

        $monthsList = array_values($grouped);
        $grandTotal = array_sum(array_column($monthsList, 'subtotal'));
        $totalCount = count($records);

        return [
            'date_from' => $dateFrom,
            'date_to' => $dateTo,
            'months' => $monthsList,
            'grand_total' => $grandTotal,
            'total_count' => $totalCount,
        ];
    }

    /**
     * Get all outstanding checks within an optional date range, grouped by month (JSON API).
     */
    public function getOutstandingChecks(Request $request)
    {
        $request->validate([
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date',
        ]);

        $data = $this->buildOutstandingChecksData($request);

        return response()->json($data);
    }

    /**
     * Generate PDF stream for outstanding checks report using Blade view template.
     */
    public function printOutstandingChecksPdf(Request $request)
    {
        @ini_set('memory_limit', '512M');
        @set_time_limit(300);

        $request->validate([
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date',
        ]);

        try {
            $data = $this->buildOutstandingChecksData($request);

            $pdf = Pdf::loadView('pdfs.outstanding_checks', [
                'dateFrom' => $data['date_from'],
                'dateTo' => $data['date_to'],
                'months' => $data['months'],
                'grandTotal' => $data['grand_total'],
                'totalCount' => $data['total_count'],
            ])
                ->setPaper('a4', 'portrait')
                ->setOption('isFontSubsettingEnabled', false)
                ->setOption('isRemoteEnabled', false);

            return $pdf->stream('outstanding_checks_report.pdf');
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Failed to generate outstanding checks PDF: '.$e->getMessage(), [
                'exception' => $e,
            ]);

            return response()->json([
                'message' => 'Failed to generate PDF. You can use the "Print Report" browser option as a fast alternative.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Render HTML print view for outstanding checks report using Blade view template.
     * Uses native browser print engine (handles 2000+ records in milliseconds with zero DomPDF overhead).
     */
    public function printOutstandingChecksHtml(Request $request)
    {
        $request->validate([
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date',
        ]);

        $data = $this->buildOutstandingChecksData($request);

        return view('pdfs.outstanding_checks', [
            'dateFrom' => $data['date_from'],
            'dateTo' => $data['date_to'],
            'months' => $data['months'],
            'grandTotal' => $data['grand_total'],
            'totalCount' => $data['total_count'],
            'autoPrint' => true,
        ]);
    }

    /**
     * Export reconciliation records into an Excel file (.xlsx) matching the PDF report format.
     * Context-aware: exports whatever tab, month/date range, and filters are currently active on the page.
     */
    public function export(Request $request)
    {
        @ini_set('memory_limit', '512M');
        @set_time_limit(300);

        // 1. Resolve active tab
        $tab = $request->string('tab')->toString();
        if ($tab === '') {
            if ($request->boolean('is_duplicate') || ($request->input('filters.is_duplicate') === '1' || $request->input('filters.is_duplicate') === 'true')) {
                $tab = 'duplicates';
            } elseif ($request->filled('status')) {
                $tab = $request->string('status')->toString();
            } elseif ($request->filled('filters.status')) {
                $statusFilter = $request->input('filters.status');
                $tab = is_array($statusFilter) ? ($statusFilter[0] ?? 'all') : (string) $statusFilter;
            } else {
                $tab = 'all';
            }
        }

        // 2. Resolve Report Title
        $reportTitles = [
            'Outstanding' => 'OUTSTANDING CHECKS',
            'Matched' => 'MATCHED CHECKS',
            'Amount Mismatch' => 'AMOUNT MISMATCH CHECKS',
            'Unrecorded Bank Entry' => 'UNRECORDED BANK ENTRIES',
            'duplicates' => 'DUPLICATE CHECKS',
            'all' => 'ALL RECONCILIATION CHECKS',
        ];
        $reportTitle = $reportTitles[$tab] ?? (strtoupper(str_replace('_', ' ', $tab)).' CHECKS');

        // 3. Resolve Date Range Label
        $dateFrom = $request->string('date_from')->toString();
        $dateTo = $request->string('date_to')->toString();
        $periodFrom = $request->string('period_from')->toString();
        $periodTo = $request->string('period_to')->toString();

        $effectiveFrom = $periodFrom !== '' ? $periodFrom : $dateFrom;
        $effectiveTo = $periodTo !== '' ? $periodTo : $dateTo;

        if ($effectiveFrom !== '') {
            $fromFormatted = Carbon::parse($effectiveFrom)->format('F j, Y');
            $toFormatted = $effectiveTo !== '' ? Carbon::parse($effectiveTo)->format('F j, Y') : $fromFormatted;
            $dateRangeLabel = $effectiveFrom === $effectiveTo
                ? $fromFormatted
                : "{$fromFormatted} - {$toFormatted}";
        } else {
            $dateRangeLabel = 'For All Dates';
        }

        // 4. Build Filtered Query
        $baseQuery = $this->buildFilteredQuery($request);

        if ($tab === 'duplicates') {
            $baseQuery->where('reconciliation_workspace.is_duplicate', true);
        } elseif ($tab !== 'all' && $tab !== '') {
            $baseQuery->where('reconciliation_workspace.status', $tab);
        }

        // 5. Fetch lightweight records
        $records = $baseQuery->select([
            'reconciliation_workspace.ref_no',
            'reconciliation_workspace.description',
            'reconciliation_workspace.internal_amount',
            'reconciliation_workspace.bank_amount',
            'reconciliation_workspace.internal_date_issued',
            'reconciliation_workspace.transaction_date',
            'reconciliation_workspace.status',
        ])
            ->orderByRaw('COALESCE(reconciliation_workspace.internal_date_issued, reconciliation_workspace.transaction_date) ASC')
            ->orderBy('reconciliation_workspace.ref_no', 'asc')
            ->toBase()
            ->get();

        // 6. Group by Month
        $grouped = [];
        foreach ($records as $record) {
            $rawDate = $record->internal_date_issued ?: $record->transaction_date;
            $dateObj = $rawDate ? Carbon::parse($rawDate) : null;
            $monthKey = $dateObj ? $dateObj->format('Y-m') : 'Unknown';
            $monthLabel = $dateObj ? $dateObj->format('F Y') : 'Unknown Date';

            if (! isset($grouped[$monthKey])) {
                $grouped[$monthKey] = [
                    'month_key' => $monthKey,
                    'month_label' => $monthLabel,
                    'items' => [],
                    'subtotal' => 0.0,
                ];
            }

            $amount = (float) ($record->internal_amount !== null ? $record->internal_amount : ($record->bank_amount ?? 0));

            $grouped[$monthKey]['items'][] = [
                'no' => count($grouped[$monthKey]['items']) + 1,
                'date' => '',
                'raw_date' => (string) ($rawDate ?? ''),
                'payee_name' => $record->description ?? '',
                'check_no' => $record->ref_no ?? '',
                'amount' => $amount,
                'date_cleared' => '',
                'status' => $record->status ?? '',
            ];

            $grouped[$monthKey]['subtotal'] += $amount;
        }

        $monthsList = array_values($grouped);
        $grandTotal = array_sum(array_column($monthsList, 'subtotal'));
        $totalCount = count($records);

        // 7. Dynamic File Name
        $sanitizedTitle = str_replace([' ', '/', '\\'], '_', ucwords(strtolower($reportTitle)));
        $sanitizedPeriod = str_replace([' ', ',', '–', '-'], '_', $dateRangeLabel);
        $fileName = "{$sanitizedTitle}_{$sanitizedPeriod}.xlsx";

        return Excel::download(
            new BankReconciliationExport(
                $reportTitle,
                $dateRangeLabel,
                $monthsList,
                $grandTotal,
                $totalCount
            ),
            $fileName
        );
    }
}
