<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\Planter;
use App\Models\Production;
use App\Models\Certification;
use App\Models\Land;
use Inertia\Inertia;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

class LandController extends Controller
{
    public function index(){
        $lands = Land::with('planter')->get()->map(function ($land) {
            $land->planter_name = $land->planter ? $land->planter->name : '';
            return $land;
        });
        $planters = Planter::with('lands')->get();
        $planterNames = $planters->pluck('name')->toArray();
        return Inertia::render('Lands/Index', ['lands' => $lands,'planterNames'=>$planterNames, 'planters' => $planters]);
    }

    public function create($planterId){
        // eager-load the planter's lands (and planter on each land if needed)
        $planter = Planter::with('lands.planter')->findOrFail($planterId);
        $lands = $planter->lands;

        return Inertia::render('Lands/Create', ['planter' => $planter, 'lands' => $lands]);
    }

    public function store(Request $request, $planterId){
        $planter = Planter::findOrFail($planterId);

         $validated = $request->validate([
            'lands' => 'nullable|array',
            'lands.*.land_code' => 'required_with:lands|string|max:255|unique:lands,land_code',
            'lands.*.name' => 'required_with:lands|string|max:255',
            'lands.*.address' => 'required_with:lands|string|max:255',
            'lands.*.area_hectares' => 'required_with:lands|numeric|min:0',
            'lands.*.distance_from_urc' => 'required_with:lands|numeric|min:0',
            'lands.*.is_active' => 'required_with:lands|boolean',


        ]);

        $landsToCreate = array_filter($validated['lands'] ?? [], function ($land) {
            return !empty($land['name']);
        });

        if (!empty($landsToCreate)) {
            DB::transaction(function () use ($planter, $landsToCreate) {
                $planter->lands()->createMany($landsToCreate);
            });
        }

        return redirect()->route('lands.index')->with('success', 'Land created successfully.');
    }

    public function show($landId){
        $land = Land::with('planter')->findOrFail($landId);
        $planter = $land->planter;
        return Inertia::render('Lands/View', ['land' => $land, 'planter' => $planter]);
    }

    public function update(Request $request, $landId){
        $land = Land::findOrFail($landId);

        $validatedData = $request->validate([
            'land_code' => 'required|string|max:255|unique:lands,land_code,' . $land->id,
            'name' => 'required|string|max:255',
            'address' => 'required|string|max:255',
            'area_hectares' => 'required|numeric|min:0',
            'distance_from_urc' => 'required|numeric|min:0',
            'is_active' => 'required|boolean',
        ]);

        $land->update($validatedData);

        return redirect()->route('lands.show', $land->id)->with('success', 'Land information updated successfully.');
    }

    public function bulkDestroy(Request $request)
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'distinct', 'exists:lands,id'],
        ]);

        Land::whereIn('id', $validated['ids'])->delete();

        return redirect()->back()->with('success', 'Selected lands deleted successfully.');
    }


}
