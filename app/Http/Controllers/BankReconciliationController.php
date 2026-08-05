<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\BankStatement;
use App\Models\InternalDisbursements;
use Inertia\Inertia;
use App\Models\ReconciliationWorkspace;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

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
                $query->whereRaw('lower(' . $wrapped . ') like ?', [strtolower($value)], $boolean);

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

        if ($request->filled('status') && !array_key_exists('status', $filters)) {
            $filters['status'] = $request->input('status');
        }

        if ($request->filled('disbursement_week') && !array_key_exists('disbursement_week', $filters)) {
            $filters['disbursement_week'] = $request->input('disbursement_week');
        }
        if ($request->filled('is_duplicate') && !array_key_exists('is_duplicate', $filters)) {
            $filters['is_duplicate'] = $request->input('is_duplicate');
        }

        if (!empty($filters) && is_array($filters)) {
            foreach ($filters as $column => $value) {
                if (!array_key_exists($column, $columnMap)) {
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
                            $applyLike($query, $dbColumn, '%' . $filterValue . '%', 'or');
                        }
                    }
                });
            }
        }

        if ($search !== '') {
            $like = '%' . $search . '%';
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

        $weekOptions = InternalDisbursements::query()
            ->whereNotNull('disbursement_week')
            ->distinct()
            ->orderBy('disbursement_week')
            ->pluck('disbursement_week');

        $kpiStats = $this->buildKpiStats($periodFrom, $periodTo);

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
            ]);
        }

        // Single aggregate query for total count and sum totals
        $summary = (clone $baseQuery)->selectRaw("
            COUNT(*) as total_count,
            COALESCE(SUM(internal_amount), 0) as internal_total,
            COALESCE(SUM(bank_amount), 0) as bank_total
        ")->first();

        $totalCount = (int) ($summary->total_count ?? 0);

        $summaryStats = [
            'total_count'    => $totalCount,
            'internal_total' => (float) ($summary->internal_total ?? 0),
            'bank_total'     => (float) ($summary->bank_total ?? 0),
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
        ]);
    }

    /**
     * Single-pass KPI aggregate calculation.
     */
    private function buildKpiStats(string $periodFrom, string $periodTo): array
    {
        $query = ReconciliationWorkspace::query();

        if ($periodFrom !== '') {
            $periodToResolved = $periodTo !== '' ? $periodTo : $periodFrom;
            $query->where(function ($q) use ($periodFrom, $periodToResolved) {
                $q->whereBetween('reconciliation_workspace.internal_date_issued', [$periodFrom, $periodToResolved])
                    ->orWhereBetween('reconciliation_workspace.transaction_date', [$periodFrom, $periodToResolved]);
            });
        }

        $stats = $query->selectRaw("
            COUNT(CASE WHEN status = 'Matched' THEN 1 END) as matched,
            COUNT(CASE WHEN status = 'Outstanding' THEN 1 END) as outstanding,
            COUNT(CASE WHEN status = 'Amount Mismatch' THEN 1 END) as mismatched,
            COUNT(CASE WHEN status = 'Unrecorded Bank Entry' THEN 1 END) as unrecorded,
            COUNT(CASE WHEN is_duplicate = 1 THEN 1 END) as duplicates
        ")->first();

        return [
            'matched' => (int) ($stats->matched ?? 0),
            'outstanding' => (int) ($stats->outstanding ?? 0),
            'mismatched' => (int) ($stats->mismatched ?? 0),
            'unrecorded' => (int) ($stats->unrecorded ?? 0),
            'duplicates' => (int) ($stats->duplicates ?? 0),
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

            if (!is_numeric($sourceId)) {
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

        if (!empty($internalIds)) {
            $linkedBankIds = InternalDisbursements::whereIn('id', $internalIds)
                ->whereNotNull('bank_statement_id')
                ->pluck('bank_statement_id')
                ->filter()
                ->values()
                ->toArray();

            $bankIds = array_values(array_unique(array_merge($bankIds, $linkedBankIds)));

            InternalDisbursements::whereIn('id', $internalIds)->delete();
        }

        if (!empty($bankIds)) {
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
                $query->whereRaw('lower(' . $wrapped . ') like ?', [strtolower($value)], $boolean);
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

        if ($request->filled('status') && !array_key_exists('status', $filters)) {
            $filters['status'] = $request->input('status');
        }

        if ($request->filled('disbursement_week') && !array_key_exists('disbursement_week', $filters)) {
            $filters['disbursement_week'] = $request->input('disbursement_week');
        }

        if (!empty($filters) && is_array($filters)) {
            foreach ($filters as $column => $value) {
                if (!array_key_exists($column, $columnMap) || $value === '' || $value === null) {
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
                            $applyLike($q, $dbColumn, '%' . $filterValue . '%', 'or');
                        }
                    }
                });
            }
        }

        if ($search !== '') {
            $like = '%' . $search . '%';
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
        if (!empty($internalIds)) {
            $linkedBankIds = InternalDisbursements::whereIn('id', $internalIds)
                ->whereNotNull('bank_statement_id')
                ->pluck('bank_statement_id')
                ->filter()
                ->values()
                ->toArray();
        }

        $bankIds = array_values(array_unique(array_merge($unrecordedBankIds, $linkedBankIds)));

        if (!empty($internalIds)) {
            InternalDisbursements::whereIn('id', $internalIds)->delete();
        }

        if (!empty($bankIds)) {
            BankStatement::whereIn('id', $bankIds)->delete();
        }

        return redirect()->back()->with('success', 'All matching reconciliation records have been cleared.');
    }
}
