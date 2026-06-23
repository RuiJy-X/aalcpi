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
            'internal_source' => 'reconciliation_workspace.internal_source',
            'bank_source' => 'reconciliation_workspace.bank_source',
        ];

        $baseQuery = ReconciliationWorkspace::query();

        if ($request->filled('status') && !array_key_exists('status', $filters)) {
            $filters['status'] = $request->input('status');
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

                $baseQuery->where(function ($query) use ($applyLike, $dbColumn, $values) {
                    foreach ($values as $filterValue) {
                        if ($filterValue === '' || $filterValue === null) {
                            continue;
                        }

                        $applyLike($query, $dbColumn, '%' . $filterValue . '%', 'or');
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
                
            ]);
        }

        $paginatedWorkspaces = $baseQuery->paginate($perPage)->withQueryString();

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

    //  public function bulkDestroy(Request $request)
    // {
    //     $validated = $request->validate([
    //         'ids' => ['required', 'array', 'min:1'],
    //         'ids.*' => ['integer', 'distinct', 'exists:productions,id'],
    //     ]);

    //     Production::whereIn('id', $validated['ids'])->delete();

    //     return redirect()->back()->with('success', 'Selected production records deleted successfully.');
    // }

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
            'bank_source' => 'reconciliation_workspace.bank_source',
        ];

        $query = ReconciliationWorkspace::query();

        if ($request->filled('status') && !array_key_exists('status', $filters)) {
            $filters['status'] = $request->input('status');
        }

        if (!empty($filters) && is_array($filters)) {
            foreach ($filters as $column => $value) {
                if (!array_key_exists($column, $columnMap) || $value === '' || $value === null) {
                    continue;
                }
                $dbColumn = $columnMap[$column];
                $values = is_array($value) ? $value : [$value];
                $query->where(function ($q) use ($applyLike, $dbColumn, $values) {
                    foreach ($values as $filterValue) {
                        if ($filterValue === '' || $filterValue === null) {
                            continue;
                        }
                        $applyLike($q, $dbColumn, '%' . $filterValue . '%', 'or');
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