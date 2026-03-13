<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Imports\ProductionsImport;
use App\Models\Production;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

use Maatwebsite\Excel\Facades\Excel;

class ProductionController extends Controller
{

    public function index(){
        $productions = Production::with(['planter', 'land'])->get()->map(function ($production) {
            $production->planter_name = $production->planter ? $production->planter->name : null;
            $production->land_address = $production->land ? $production->land->address : null;
            $production->land_name = $production->land ? $production->land->name : null;
            return $production;
        });
        return Inertia::render('Productions/Index', ['productions' => $productions]);

    }

    public function show($productionId)
    {
        $production = Production::with('planter')
            ->where('id', $productionId)
            ->firstOrFail();

        return Inertia::render('Productions/View', [
            'production' => $production,
            'planter' => $production->planter,
            'land' => $production->land,
        ]);
    }

    public function import(Request $request)
    {
        // Implementation for importing productions

        $file = $request->file('file');

        Excel::import(new ProductionsImport, $file);

        return back()->with('success', 'Productions imported successfully.');

    }

    public function get()
    {
        return Production::with(['planter', 'land'])->latest()->get();
    }

    public function header()
    {
        return response()->json(Schema::getColumnListing('productions'));
    }

    public function create(Request $request)
    {
        $validated = $request->validate([
            'planter_id' => 'required|exists:planters,id',
            'land_id' => 'required|exists:lands,id',
            'production_year' => 'required|integer',
            'production_month' => 'required|string',
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
            'land_id' => 'required|exists:lands,id',
            'production_year' => 'required|integer',
            'production_month' => 'required|string|
            max:255',
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

}
