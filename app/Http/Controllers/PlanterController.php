<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Jobs\ProcessExcelImportJob;
use App\Models\ImportJob;
use App\Models\ImportMapping;
use App\Models\Planter;
use App\Models\Production;
use App\Models\Hacienda;
use App\Models\MillingPeriod;
use Inertia\Inertia;
use Illuminate\Support\Facades\Schema;
use Carbon\Carbon;
use Illuminate\Support\Collection;


class PlanterController extends Controller
{
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
            'planter_code' => 'planters.planter_code',
            'name' => 'planters.name',
            'address' => 'planters.address',
            'tin_number' => 'planters.tin_number',
            'contact_number' => 'planters.contact_number',
            'registration_date' => 'planters.registration_date',
            'created_at' => 'planters.created_at',
            'updated_at' => 'planters.updated_at',
        ];

        $baseQuery = Planter::query()->select([
            'planters.id',
            'planters.planter_code',
            'planters.name',
            'planters.address',
            'planters.tin_number',
            'planters.contact_number',
            'planters.registration_date',
            'planters.created_at',
            'planters.updated_at',
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
                $applyLike($query, 'planters.planter_code', $like, 'or');
                $applyLike($query, 'planters.name', $like, 'or');
                $applyLike($query, 'planters.address', $like, 'or');
                $applyLike($query, 'planters.tin_number', $like, 'or');
                $applyLike($query, 'planters.contact_number', $like, 'or');
                $applyLike($query, 'planters.registration_date', $like, 'or');
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
            $baseQuery->orderBy('planters.id', 'desc');
        }

        $paginatedPlanters = $baseQuery->paginate($perPage)->withQueryString();

        return Inertia::render('Planters/Index', [
            'planters' => $paginatedPlanters->items(),
            'pagination' => [
                'total' => $paginatedPlanters->total(),
                'per_page' => $paginatedPlanters->perPage(),
                'current_page' => $paginatedPlanters->currentPage(),
                'last_page' => $paginatedPlanters->lastPage(),
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
        ]);
    }

    public function create(){
        return Inertia::render('Planters/Create');
    }



    public function data()
    {
        $planters = Planter::with('haciendas')->get();


        return response()->json($planters);
    }

    public function header()
    {
        return response()->json(Schema::getColumnListing('planters'));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'planter_code' => 'required|string|max:255|unique:planters,planter_code',
            'name'           => 'required|string|max:255',
            'address'        => 'required|string',
            'contact_number' => 'required|string',
            'tin_number'     => 'required|string|unique:planters,tin_number',
            'registration_date' => (now()->toDateString() >= $request->registration_date) ? 'required|date' : 'required|date|before_or_equal:today',
            'haciendas' => 'nullable|array',
            'haciendas.*.hacienda_code' => 'required_with:haciendas|string|max:255',
            'haciendas.*.name' => 'required_with:haciendas|string|max:255',
            'haciendas.*.address' => 'required_with:haciendas|string|max:255',
            'haciendas.*.area_hectares' => 'required_with:haciendas|numeric|min:0',
            'haciendas.*.distance_from_urc' => 'required_with:haciendas|numeric|min:0',
            'haciendas.*.is_active' => 'required_with:haciendas|boolean',
        ]);



        $planter = Planter::create($validated);
        $validatedhaciendas = $validated['haciendas'] ?? [];
        $validatedhaciendas = array_values(array_filter($validatedhaciendas, function ($hacienda) {
            return !empty($hacienda['name'])
                || !empty($hacienda['address'])
                || isset($hacienda['area_hectares'])
                || isset($hacienda['distance_from_urc']);
        }));

        if (!empty($validatedhaciendas)) {
            $planter->haciendas()->createMany($validatedhaciendas);
        }

        return redirect()->back()->with('success', 'Planter created successfully!');


    }

    public function update(Request $request, $id)
    {
        $planter = Planter::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'required|string',
            'contact_number' => 'required|string',
            'tin_number' => 'required|string',
            'registration_date' => (now()->toDateString() >= $request->registration_date) ? 'required|date' : 'required|date|before_or_equal:today',
            'updated_at' => [(now()->toDateString() >= $request->updated_at) , 'nullable|date']
        ]);

        $planter->update($validated);


        return redirect()->route('planters.show', $planter->id)->with('success', 'Planter information updated successfully.');
    }

    public function destroy($id)
    {
        $planter = Planter::findOrFail($id);
        $planter->delete();

        return redirect()->route('planters.index')->with('success', 'Planter deleted successfully.');
    }

    public function bulkDestroy(Request $request)
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'distinct', 'exists:planters,id'],
        ]);

        Planter::whereIn('id', $validated['ids'])->delete();

        return redirect()->back()->with('success', 'Selected planters deleted successfully.');
    }

    public function show($id, Request $request)
    {

        $selectedCropYear = $request->string('crop_year')->toString();
        $selectedWeek = $request->string('week_no')->toString();
        $selectedViewMode = $request->string('view_mode')->toString();

        if (!in_array($selectedViewMode, ['weekly', 'yearly'], true)) {
            $selectedViewMode = 'weekly';
        }

        $millingPeriods = MillingPeriod::query()
            ->orderByDesc('crop_year')
            ->orderBy('week_no')
            ->get();

        $planter = Planter::with(['haciendas', 'productions'])->findOrFail($id);

        $productions = Production::with(['planter', 'hacienda'])
            ->where('planter_id', $planter->id)
            ->orWhereHas('hacienda', fn ($query) => $query->where('planter_id', $planter->id))
            ->latest()
            ->get()->map(function ($production) use ($millingPeriods) {
                $productionDate = $this->resolveProductionDate($production);
                $matchingPeriod = $millingPeriods->first(function ($period) use ($productionDate) {
                    if (!$productionDate) {
                        return false;
                    }

                    $start = Carbon::parse($period->start_date)->startOfDay();
                    $end = Carbon::parse($period->end_date)->endOfDay();

                    return $productionDate->between($start, $end, true);
                });

                $production->planter_name = $production->planter ? $production->planter->name : null;
                $production->hacienda_address = $production->hacienda ? $production->hacienda->address : null;
                $production->hacienda_name = $production->hacienda ? $production->hacienda->name : null;
                $production->production_date = $productionDate ? $productionDate->toDateString() : null;
                $production->crop_year = $production->crop_year ?? $matchingPeriod?->crop_year;
                $production->week_no = $matchingPeriod?->week_no;

                return $production;
            });

        if ($selectedCropYear !== '' && $selectedCropYear !== 'all') {
            $productions = $productions->where('crop_year', $selectedCropYear);
        }

        if ($selectedWeek !== '' && $selectedWeek !== 'all') {
            $selectedWeekInt = (int) $selectedWeek;
            $productions = $productions->where('week_no', $selectedWeekInt);
        }

        if ($selectedViewMode === 'yearly') {
            $productions = $this->aggregateYearlyProductions($productions);
        }

        $cropYears = $millingPeriods
            ->pluck('crop_year')
            ->filter()
            ->unique()
            ->values();

        $weeksByCropYear = $millingPeriods
            ->groupBy('crop_year')
            ->map(fn ($periods) => $periods->pluck('week_no')->unique()->sort()->values())
            ->toArray();



        $haciendas = Hacienda::with('planter')->where('planter_id', $id)->get()->map(function ($hacienda) {
            $hacienda->planter_name = $hacienda->planter ? $hacienda->planter->name : '';
            return $hacienda;
        });

        return Inertia::render('Planters/View', [
            'planter' => $planter,
            'haciendas' => $haciendas,
            'productions' => $productions->values(),
            'crop_years' => $cropYears,
            'weeks_by_crop_year' => $weeksByCropYear,
            'filters' => [
                'crop_year' => $selectedCropYear,
                'week_no' => $selectedWeek,
                'view_mode' => $selectedViewMode,
            ],
        ]);
    }

    public function import(Request $request)
    {
        $validated = $request->validate([
            'file' => ['required', 'file'],
            'mapping_id' => ['required', 'integer', 'exists:import_mappings,id'],
        ]);

        $mapping = ImportMapping::query()
            ->where('id', $validated['mapping_id'])
            ->where('import_type', 'planters')
            ->first();

        if (!$mapping) {
            return back()->with('error', 'Import mapping not found for planters.');
        }

        $storedPath = $validated['file']->store('imports', 'local');
        $importJob = ImportJob::create([
            'user_id' => $request->user()?->id,
            'type' => 'planters_excel',
            'status' => ImportJob::STATUS_QUEUED,
        ]);

        ProcessExcelImportJob::dispatch(
            $importJob->id,
            'planters_excel',
            $storedPath,
            [
                'mapping' => $mapping->mapping ?? [],
            ],
        );

        return back()
            ->with('success', 'Planter import queued. You can keep using the app while it processes.')
            ->with('import_job_id', $importJob->id);

    }

    private function resolveProductionDate(Production $production): ?Carbon
    {
        if (empty($production->production_date)) {
            return null;
        }

        return Carbon::parse($production->production_date)->startOfDay();
    }

    private function aggregateYearlyProductions(Collection $productions): Collection
    {
        $numericFields = [
            'gross_cw',
            'net_cw',
            'trucks',
            'theoretical_lkg',
            'actual_lkg',
            'pshr_net_lkg',
            'pdpa_lkg',
            'association_dues_lkg',
            'actual_mol',
            'pshr_net_mol',
            'pdpa_mol',
            'association_dues_mol',
            'distribution_total',
            'molasses_total',
            'planter_lkg_money',
            'pdpa_lkg_money',
            'association_dues_lkg_money',
            'planter_mol_money',
            'pdpa_mol_money',
            'association_dues_mol_money',
        ];

        return $productions
            ->groupBy(function ($production) {
                $cropYear = $production->crop_year ?: 'Unknown Crop Year';

                return $production->planter_id . '::' . $cropYear;
            })
            ->map(function (Collection $groupedProductions) use ($numericFields) {
                $baseProduction = $groupedProductions->first();
                $cropYear = $baseProduction->crop_year ?: 'Unknown Crop Year';

                $baseProduction->id = 'yearly-' . $baseProduction->planter_id . '-' . $cropYear;
                $baseProduction->crop_year = $cropYear;
                $baseProduction->week_no = null;
                $baseProduction->production_date = null;
                $baseProduction->trans_code = null;
                $baseProduction->transloading = null;
                $baseProduction->hacienda_id = '';
                $baseProduction->hacienda_code = '-';
                $baseProduction->hacienda_name = 'All haciendas';
                $baseProduction->hacienda_address = '-';

                foreach ($numericFields as $field) {
                    $baseProduction->{$field} = $groupedProductions->sum(function ($row) use ($field) {
                        $value = $row->{$field} ?? 0;

                        return is_numeric($value) ? (float) $value : 0;
                    });
                }

                return $baseProduction;
            })
            ->values();
    }
}
