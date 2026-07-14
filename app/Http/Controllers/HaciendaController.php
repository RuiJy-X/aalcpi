<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Http\Controllers\Concerns\HandlesBulkUpdates;
use App\Models\Planter;
use App\Models\Hacienda;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class HaciendaController extends Controller
{
    use HandlesBulkUpdates;

    public function index(Request $request)
    {
        $perPage = min(max(1, $request->integer('per_page', 10)), 100);
        $sort = $request->string('sort')->toString();
        $direction = strtolower($request->string('direction')->toString()) === 'asc' ? 'asc' : 'desc';
        $search = $request->string('search')->toString();
        $filters = $request->input('filters', []);
        $dateColumn = $request->string('date_column')->toString();
        $dateFrom = $request->string('date_from')->toString();
        $dateTo = $request->string('date_to')->toString();
        $periodFrom = $request->string('period_from')->toString();
        $periodTo = $request->string('period_to')->toString();
        if ($periodFrom !== '') {
            $dateColumn = 'created_at';
            $dateFrom = $periodFrom;
            $dateTo = ($periodTo !== '' ? $periodTo : $periodFrom).' 23:59:59';
        }
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
            'hacienda_code' => 'haciendas.hacienda_code',
            'planter_name' => 'planters.name',
            'name' => 'haciendas.name',
            'address' => 'haciendas.address',
            'area_hectares' => 'haciendas.area_hectares',
            'distance_from_urc' => 'haciendas.distance_from_urc',
            'is_active' => 'haciendas.is_active',
            'created_at' => 'haciendas.created_at',
            'updated_at' => 'haciendas.updated_at',
        ];

        $numericColumns = [
            'area_hectares',
            'distance_from_urc',
        ];

        $baseQuery = Hacienda::query()
            ->leftJoin('planters', 'haciendas.planter_id', '=', 'planters.id')
            ->select([
                'haciendas.id',
                'haciendas.planter_id',
                'haciendas.hacienda_code',
                'haciendas.name',
                'haciendas.address',
                'haciendas.area_hectares',
                'haciendas.distance_from_urc',
                'haciendas.is_active',
                'haciendas.created_at',
                'haciendas.updated_at',
                'planters.name as planter_name',
            ]);

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

                if ($column === 'is_active') {
                    $normalized = array_map(fn ($v) => filter_var($v, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE), $values);
                    $normalized = array_values(array_filter($normalized, fn ($v) => $v !== null));

                    if (!empty($normalized)) {
                        $baseQuery->whereIn($dbColumn, $normalized);
                    }

                    continue;
                }

                if (in_array($column, $numericColumns, true)) {
                    $numericValues = array_filter($values, fn ($v) => $v !== '' && $v !== null && is_numeric($v));
                    if (!empty($numericValues)) {
                        $baseQuery->whereIn($dbColumn, $numericValues);
                    }

                    continue;
                }

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
                $applyLike($query, 'haciendas.hacienda_code', $like, 'or');
                $applyLike($query, 'planters.name', $like, 'or');
                $applyLike($query, 'haciendas.name', $like, 'or');
                $applyLike($query, 'haciendas.address', $like, 'or');
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
            $baseQuery->orderBy('haciendas.id', 'desc');
        }

        $paginatedHaciendas = $baseQuery->paginate($perPage)->withQueryString();

        $statsQuery = Hacienda::query();
        if ($periodFrom !== '') {
            $periodEnd = ($periodTo !== '' ? $periodTo : $periodFrom).' 23:59:59';
            $statsQuery->whereBetween('created_at', [$periodFrom, $periodEnd]);
        }

        $stats = [
            'totalHaciendas' => (clone $statsQuery)->count(),
            'totalArea' => round((float) (clone $statsQuery)->sum('area_hectares'), 2),
            'uniquePlanters' => (int) (clone $statsQuery)
                ->whereNotNull('planter_id')
                ->distinct()
                ->count('planter_id'),
            'activeHaciendas' => (clone $statsQuery)->where('is_active', true)->count(),
        ];

        return Inertia::render('Haciendas/Index', [
            'haciendas' => $paginatedHaciendas->items(),
            'pagination' => [
                'total' => $paginatedHaciendas->total(),
                'per_page' => $paginatedHaciendas->perPage(),
                'current_page' => $paginatedHaciendas->currentPage(),
                'last_page' => $paginatedHaciendas->lastPage(),
            ],
            'table_state' => [
                'search' => $search,
                'sort' => $sort,
                'direction' => $direction,
                'filters' => $filters,
                'period_from' => $periodFrom,
                'period_to' => $periodTo,
            ],
            'stats' => $stats,
        ]);
    }

    public function create($planterId){
        // eager-load the planter's haciendas (and planter on each hacienda if needed)
        $planter = Planter::with('haciendas.planter')->findOrFail($planterId);
        $haciendas = $planter->haciendas;

        return Inertia::render('Haciendas/Create', ['planter' => $planter, 'haciendas' => $haciendas]);
    }

    public function store(Request $request, $planterId){
        $planter = Planter::findOrFail($planterId);

         $validated = $request->validate([
            'haciendas' => 'nullable|array',
            'haciendas.*.hacienda_code' => 'required_with:haciendas|string|max:255|unique:haciendas,hacienda_code',
            'haciendas.*.name' => 'required_with:haciendas|string|max:255',
            'haciendas.*.address' => 'required_with:haciendas|string|max:255',
            'haciendas.*.area_hectares' => 'required_with:haciendas|numeric|min:0',
            'haciendas.*.distance_from_urc' => 'required_with:haciendas|numeric|min:0',
            'haciendas.*.is_active' => 'required_with:haciendas|boolean',


        ]);

        $haciendasToCreate = array_filter($validated['haciendas'] ?? [], function ($hacienda) {
            return !empty($hacienda['name']);
        });

        if (!empty($haciendasToCreate)) {
            DB::transaction(function () use ($planter, $haciendasToCreate) {
                $planter->haciendas()->createMany($haciendasToCreate);
            });
        }

        return redirect()->route('haciendas.index')->with('success', 'hacienda created successfully.');
    }

    public function show($haciendaId){
        $hacienda = Hacienda::with('planter')->findOrFail($haciendaId);
        $planter = $hacienda->planter;
        return Inertia::render('Haciendas/View', ['hacienda' => $hacienda, 'planter' => $planter]);
    }

    public function update(Request $request, $haciendaId){
        $hacienda = Hacienda::findOrFail($haciendaId);

        $validatedData = $request->validate([
            'hacienda_code' => 'required|string|max:255|unique:haciendas,hacienda_code,' . $hacienda->id,
            'name' => 'required|string|max:255',
            'address' => 'required|string|max:255',
            'area_hectares' => 'required|numeric|min:0',
            'distance_from_urc' => 'required|numeric|min:0',
            'is_active' => 'required|boolean',
        ]);

        $hacienda->update($validatedData);

        return redirect()->route('haciendas.show', $hacienda->id)->with('success', 'Hacienda information updated successfully.');
    }

    public function bulkUpdate(Request $request)
    {
        return $this->performBulkUpdate(
            $request,
            Hacienda::class,
            [
                'hacienda_code' => ['sometimes', 'nullable', 'string', 'max:255'],
                'name' => ['sometimes', 'nullable', 'string', 'max:255'],
                'address' => ['sometimes', 'nullable', 'string', 'max:255'],
                'area_hectares' => ['sometimes', 'nullable', 'numeric', 'min:0'],
                'distance_from_urc' => ['sometimes', 'nullable', 'numeric', 'min:0'],
                'is_active' => ['sometimes', 'nullable', 'boolean'],
            ],
            successLabel: 'hacienda',
        );
    }

    public function bulkDestroy(Request $request)
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'distinct', 'exists:haciendas,id'],
        ]);

        Hacienda::whereIn('id', $validated['ids'])->delete();

        return redirect()->back()->with('success', 'Selected haciendas deleted successfully.');
    }


}
