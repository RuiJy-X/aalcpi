<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\Planter;
use App\Models\Production;
use App\Models\Certification;
use App\Models\Hacienda;
use Inertia\Inertia;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

class HaciendaController extends Controller
{
    public function index(){
        $haciendas = Hacienda::with('planter')->get()->map(function ($hacienda) {
            $hacienda->planter_name = $hacienda->planter ? $hacienda->planter->name : '';
            return $hacienda;
        });
        $planters = Planter::with('haciendas')->get();
        $planterNames = $planters->pluck('name')->toArray();
        return Inertia::render('Haciendas/Index', ['haciendas' => $haciendas,'planterNames'=>$planterNames, 'planters' => $planters]);
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
