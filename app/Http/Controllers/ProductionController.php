<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Imports\ProductionsImport;
use App\Models\ImportMapping;
use App\Models\Production;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;
use Maatwebsite\Excel\Facades\Excel;
use Throwable;

class ProductionController extends Controller
{

    public function index(Request $request)
    {
        $selectedCropYear = $request->string('crop_year')->toString();
        $perPage = min(max(1, $request->integer('per_page', 10)), 100);
        $sort = $request->string('sort')->toString();
        $direction = strtolower($request->string('direction')->toString()) === 'asc' ? 'asc' : 'desc';
        $search = $request->string('search')->toString();
        $filters = $request->input('filters', []);
        $dateColumn = $request->string('date_column')->toString();
        $dateFrom = $request->string('date_from')->toString();
        $dateTo = $request->string('date_to')->toString();

        $columnMap = [
            'planter_code' => 'productions.planter_code',
            'planter_name' => 'planters.name',
            'hacienda_code' => 'productions.hacienda_code',
            'hacienda_name' => 'haciendas.name',
            'trans_code' => 'productions.trans_code',
            'crop_year' => 'productions.crop_year',
            'gross_cw' => 'productions.gross_cw',
            'net_cw' => 'productions.net_cw',
            'trucks' => 'productions.trucks',
            'theoretical_lkg' => 'productions.theoretical_lkg',
            'actual_lkg' => 'productions.actual_lkg',
            'pshr_net_lkg' => 'productions.pshr_net_lkg',
            'pdpa_lkg' => 'productions.pdpa_lkg',
            'association_dues_lkg' => 'productions.association_dues_lkg',
            'actual_mol' => 'productions.actual_mol',
            'pshr_net_mol' => 'productions.pshr_net_mol',
            'pdpa_mol' => 'productions.pdpa_mol',
            'association_dues_mol' => 'productions.association_dues_mol',
            'production_date' => 'productions.production_date',
            'created_at' => 'productions.created_at',
            'updated_at' => 'productions.updated_at',
        ];

        $baseQuery = Production::query()
            ->leftJoin('planters', 'productions.planter_id', '=', 'planters.id')
            ->leftJoin('haciendas', 'productions.hacienda_id', '=', 'haciendas.id')
            ->select([
                'productions.*',
                'planters.name as planter_name',
                'haciendas.name as hacienda_name',
                'haciendas.address as hacienda_address',
            ]);

        if ($selectedCropYear !== '' && $selectedCropYear !== 'all') {
            $baseQuery->where('productions.crop_year', $selectedCropYear);
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

                $baseQuery->where(function ($query) use ($dbColumn, $values) {
                    foreach ($values as $filterValue) {
                        if ($filterValue === '' || $filterValue === null) {
                            continue;
                        }

                        $query->orWhere($dbColumn, 'ilike', '%' . $filterValue . '%');
                    }
                });
            }
        }

        if ($search !== '') {
            $like = '%' . $search . '%';
            $baseQuery->where(function ($query) use ($like) {
                $query->orWhere('productions.planter_code', 'ilike', $like)
                    ->orWhere('planters.name', 'ilike', $like)
                    ->orWhere('productions.hacienda_code', 'ilike', $like)
                    ->orWhere('haciendas.name', 'ilike', $like)
                    ->orWhere('productions.trans_code', 'ilike', $like)
                    ->orWhere('productions.crop_year', 'ilike', $like);
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
            $baseQuery->orderBy('productions.id', 'desc');
        }

        $paginatedProductions = $baseQuery->paginate($perPage)->withQueryString();

        $cropYears = Production::query()
            ->pluck('crop_year')
            ->filter()
            ->unique()
            ->sortDesc()
            ->values();

        return Inertia::render('Productions/Index', [
            'productions' => $paginatedProductions->items(),
            'pagination' => [
                'total' => $paginatedProductions->total(),
                'per_page' => $paginatedProductions->perPage(),
                'current_page' => $paginatedProductions->currentPage(),
                'last_page' => $paginatedProductions->lastPage(),
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
            'crop_years' => $cropYears,
            'filters' => [
                'crop_year' => $selectedCropYear,
            ],
        ]);

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

    public function show($productionId)
    {
        $production = Production::with('planter')
            ->where('id', $productionId)
            ->firstOrFail();

        return Inertia::render('Productions/View', [
            'production' => $production,
            'planter' => $production->planter,
            'hacienda' => $production->hacienda,
        ]);
    }

    public function import(Request $request)
    {
        $validated = $request->validate([
            'file' => ['required', 'file'],
            'crop_year' => ['required', 'regex:/^\d{4}-\d{4}$/'],
            'mapping_id' => ['required', 'integer', 'exists:import_mappings,id'],
        ]);

        $file = $validated['file'];
        $cropYear = $validated['crop_year'];

        $mapping = ImportMapping::query()
            ->where('id', $validated['mapping_id'])
            ->where('import_type', 'productions')
            ->first();

        if (!$mapping) {
            return back()->with('error', 'Import mapping not found for productions.');
        }

        try {
            Excel::import(new ProductionsImport($cropYear, $mapping->mapping ?? []), $file);
        } catch (Throwable $e) {
            Log::error('Productions import failed', [
                'message' => $e->getMessage(),
                'exception' => $e,
            ]);

            return back()->with(
                'error',
                'Productions import failed. ' . $e->getMessage()
            );
        }

        return back()->with('success', 'Productions imported successfully.');

    }

    public function get()
    {
        return Production::with(['planter', 'hacienda'])->latest()->get();
    }

    public function header()
    {
        return response()->json(Schema::getColumnListing('productions'));
    }

    public function create(Request $request)
    {
        $validated = $request->validate([
            'planter_id' => 'required|exists:planters,id',
            'hacienda_id' => 'required|exists:haciendas,id',
            'crop_year' => ['required', 'regex:/^\d{4}-\d{4}$/'],
            'gross_cw' => 'required|numeric',
            'net_cw' => 'required|numeric',
            'trucks' => 'required|integer',
            'theoretical_lkg' => 'required|numeric',
            'actual_lkg' => 'required|numeric',
            'pshr_net_lkg' => 'required|numeric',
            'pdpa_lkg' => 'required|integer',
            'association_dues_lkg' => 'required|string',
            'actual_mol' => 'required|numeric',
            'pshr_net_mol' => 'required|numeric',
            'pdpa_mol' => 'required|numeric',
            'association_dues_mol' => 'required|numeric',
            'trans_code' => 'required|string',
            'transloading' => 'required|boolean',

        ]);

        $production = Production::create($validated);
        return response()->json(['message' => 'Record created!', 'data' => $production], 201);
    }

    public function destroy($productionId){
        $production = Production::findOrFail($productionId);
        $production->delete();

        return redirect()->route('productions.index')->with('success', 'Production record deleted successfully.');
    }

    public function bulkDestroy(Request $request)
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'distinct', 'exists:productions,id'],
        ]);

        Production::whereIn('id', $validated['ids'])->delete();

        return redirect()->back()->with('success', 'Selected production records deleted successfully.');
    }

    public function update(Request $request, $productionId)
    {
        $production = Production::findOrFail($productionId);



        $validated = $request->validate([
            'planter_id' => 'required|exists:planters,id',
            'hacienda_id' => 'required|exists:haciendas,id',
            'crop_year' => ['required', 'regex:/^\d{4}-\d{4}$/'],
            'gross_cw' => 'required|numeric',
            'net_cw' => 'required|numeric',
            'trucks' => 'required|integer',
            'theoretical_lkg' => 'required|numeric',
            'actual_lkg' => 'required|numeric',
            'pshr_net_lkg' => 'required|numeric',
            'pdpa_lkg' => 'required|numeric',
            'association_dues_lkg' => 'required|numeric',
            'actual_mol' => 'required|numeric',
            'pshr_net_mol' => 'required|numeric',
            'pdpa_mol' => 'required|numeric',
            'association_dues_mol' => 'required|numeric',
            'trans_code' => 'required|string|max:255',
            'transloading' => 'required|boolean'

        ]);

        $production->update($validated);

        return redirect()->route('productions.show', $production->id)
            ->with('success', 'Production information updated successfully.');
    }

    public function finalData($id)
    {
        $production = Production::with(['planter', 'hacienda'])->findOrFail($id);

        $pdf = Pdf::loadView('pdfs.weekly_data', compact('production'))->setPaper('a4', 'landscape');

    return $pdf->stream("{$production->planter->name}_weekly_data.pdf");
    }

    public function certification(Request $request)
    {

        $planter_code = $request->query('planter_code');
        $crop_year = $request->query('crop_year');


        $productions = Production::with(['planter', 'hacienda'])
            ->when($planter_code, function ($query, $planter_code) {
                $query->whereHas('planter', function ($q) use ($planter_code) {
                    $q->where('planter_code', $planter_code);
                });
            })
            ->when($crop_year, function ($query, $crop_year) {
                $query->where('crop_year', $crop_year);
            })
            ->get();

        $aggregated_collection = $this->aggregateYearlyProductions($productions);
        $aggregate_production = $aggregated_collection->first();

        if (!$aggregate_production) {
        return back()->with('error', 'No production data found for the selected criteria.');
        }

         $pdf = Pdf::loadView('pdfs.certification_final_data', ['production' => $aggregate_production])->setPaper('a4', 'portrait');

         return $pdf->stream("{$aggregate_production->planter->name}_final_data.pdf");

    }

    public function bulkDownload(Request $request)
    {

        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'distinct', 'exists:productions,id'],
        ]);

        $productions = Production::with(['planter', 'hacienda'])
            ->whereIn('id', $validated['ids'])
            ->orderBy('id')
            ->get();

        $pdf = Pdf::loadView('pdfs.certification_final_data', [
            'productions' => $productions,
        ])->setPaper('a4', 'portrait');

        return $pdf->download('productions_final_data_' . now()->format('Ymd_His') . '.pdf');

    }

}
