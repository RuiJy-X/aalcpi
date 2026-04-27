<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Imports\ProductionsImport;
use App\Models\Production;
use App\Services\FinancialDistributionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;
use Maatwebsite\Excel\Facades\Excel;

class ProductionController extends Controller
{

    public function index(Request $request)
    {
        $selectedCropYear = $request->string('crop_year')->toString();

        $productions = Production::with(['planter', 'hacienda'])
            ->get()
            ->map(function ($production) {
                $production->planter_name = $production->planter ? $production->planter->name : null;
                $production->hacienda_address = $production->hacienda ? $production->hacienda->address : null;
                $production->hacienda_name = $production->hacienda ? $production->hacienda->name : null;

                return $production;
            });

        if ($selectedCropYear !== '' && $selectedCropYear !== 'all') {
            $productions = $productions->where('crop_year', $selectedCropYear);
        }

        $cropYears = Production::query()
            ->pluck('crop_year')
            ->filter()
            ->unique()
            ->sortDesc()
            ->values();

        return Inertia::render('Productions/Index', [
            'productions' => $productions->values(),
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
        ]);

        $file = $validated['file'];
        $cropYear = $validated['crop_year'];

        Excel::import(
            new ProductionsImport(app(FinancialDistributionService::class), $cropYear),
            $file,
        );

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
            'production_date' => 'required|date',
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

        if ($production->financial_status === Production::FINANCIAL_STATUS_ACCEPTED) {
            return redirect()->back()->with('success', 'This production is financially accepted and read-only.');
        }

        $validated = $request->validate([
            'planter_id' => 'required|exists:planters,id',
            'hacienda_id' => 'required|exists:haciendas,id',
            'production_date' => 'required|date',
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
