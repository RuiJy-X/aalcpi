<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\BankStatement;
use App\Models\InternalDisbursements;
use Inertia\Inertia;
use App\Models\ReconciliationWorkspace;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class BankReconciliationController extends Controller
{
    /**
     * Shared column map for sorting/filtering. Centralized so index() and
     * buildFilteredQuery() can never drift out of sync.
     */


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
            'bank_date' => 'reconciliation_workspace.bank_date',
            'debit' => 'reconciliation_workspace.debit',
            'internal_amount' => 'reconciliation_workspace.internal_amount',
        ];

        $baseQuery = ReconciliationWorkspace::query();

        if ($request->filled('status') && !array_key_exists('status', $filters)) {
            $filters['status'] = $request->input('status');
        }

        if ($request->filled('disbursement_week') && !array_key_exists('disbursement_week', $filters)) {
            $filters['disbursement_week'] = $request->input('disbursement_week');
        }

        if ($request->filled('bank_date') && !array_key_exists('bank_date', $filters)) {
            $filters['bank_date'] = $request->input('bank_date');
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

                // disbursement_week and bank_date are exact-match dropdowns,
                // everything else stays a partial LIKE match.
                $isExactMatch = in_array($column, ['disbursement_week', 'bank_date'], true);

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

        if ($sort !== '' && isset($columnMap[$sort])) {
            $baseQuery->orderBy($columnMap[$sort], $direction);
        } else {
            $baseQuery->orderBy('reconciliation_workspace.transaction_date', 'desc');
        }
        $statusOptions = ReconciliationWorkspace::query()
            ->whereNotNull('status')
            ->where('status', '!=', '')
            ->distinct()
            ->orderBy('status')
            ->pluck('status');

        $weekOptions = ReconciliationWorkspace::query()
            ->whereNotNull('disbursement_week')
            ->distinct()
            ->orderBy('disbursement_week')
            ->pluck('disbursement_week');

        $bankDate = ReconciliationWorkspace::query()
            ->whereNotNull('bank_date')
            ->distinct()
            ->orderBy('bank_date')
            ->pluck('bank_date')
            ->map(fn($date) => \Carbon\Carbon::parse($date)->format('Y-m-d'));

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
                    'per_page' => 'all',
                ],
                'statuses' => $statusOptions,
                'weekOptions' => $weekOptions,
                'bankDateOptions' => $bankDate,
            ]);
        }

        $paginatedWorkspaces = $baseQuery->paginate($perPage)->withQueryString();

        $summaryQuery = clone $baseQuery;
        $totalCount = $summaryQuery->count();

        // 1. Internal Total: Pull ONLY from rows where 'source' is internal
        $internalTotal = $summaryQuery->sum('internal_amount');

        // 2. Bank Total: Pull ONLY from rows where the bank record actually exists inside the ledger scope
        $bankTotal = $summaryQuery->sum('bank_amount');

        // Get totals directly from the database matching the exact user filters
        $summaryStats = [
            'total_count'    => $totalCount,
            'internal_total' => $internalTotal, 
            'bank_total'     => $bankTotal,    
        ];

        return Inertia::render('BankReconciliation/Index', [
            'reconciliationWorkspaces' => $paginatedWorkspaces->items(),
            'pagination' => [
                'total' => $paginatedWorkspaces->total(),
                'per_page' => $paginatedWorkspaces->perPage(),
                'current_page' => $paginatedWorkspaces->currentPage(),
                'last_page' => $paginatedWorkspaces->lastPage(),
            ],
            'table_state' => [
                'search' => $search,
                'sort' => $sort,
                'direction' => $direction,
                'filters' => $filters,
                'date_column' => $dateColumn,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
            ],
            'statuses' => $statusOptions,
            'weekOptions' => $weekOptions,
            'bankDateOptions' => $bankDate,
            'summaryStats'             => $summaryStats, // Add this line
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
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
            'internal_date_issued' => 'reconciliation_workspace.internal_date_issued',
            'bank_date' => 'reconciliation_workspace.bank_date',
        ];

        $query = ReconciliationWorkspace::query();

        if ($request->filled('status') && !array_key_exists('status', $filters)) {
            $filters['status'] = $request->input('status');
        }

        if ($request->filled('disbursement_week') && !array_key_exists('disbursement_week', $filters)) {
            $filters['disbursement_week'] = $request->input('disbursement_week');
        }

        if ($request->filled('bank_date') && !array_key_exists('bank_date', $filters)) {
            $filters['bank_date'] = $request->input('bank_date');
        }

        if (!empty($filters) && is_array($filters)) {
            foreach ($filters as $column => $value) {
                if (!array_key_exists($column, $columnMap) || $value === '' || $value === null) {
                    continue;
                }
                $dbColumn = $columnMap[$column];
                $values = is_array($value) ? $value : [$value];
                $isExactMatch = in_array($column, ['disbursement_week', 'bank_date'], true);

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

        return $query;
    }

    public function clear(Request $request)
    {
        $matches = $this->buildFilteredQuery($request)->get(['source', 'source_id']);

        $internalIds = $matches->where('source', 'internal')->pluck('source_id');
        $bankIds = $matches->where('source', 'bank')->pluck('source_id');

        if ($internalIds->isNotEmpty()) {
            InternalDisbursements::whereIn('id', $internalIds)->delete();
        }

        if ($bankIds->isNotEmpty()) {
            BankStatement::whereIn('id', $bankIds)->delete();
        }

        return redirect()->back()->with('success', 'All matching reconciliation records have been cleared.');
    }
}