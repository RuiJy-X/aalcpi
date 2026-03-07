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

class LandViewController extends Controller
{
    public function index($planterId, $landId){
        $land = Land::with('planter')->where('planter_id', $planterId)->where('id',$landId)->firstOrFail();

        return Inertia::render('Planters/ViewLands', ['land' => $land, 'planterName' => $land->planter->name]);
    }

    public function store(Request $request, $planterId){
        $validatedData = $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'required|string|max:255',
            'area_hectares' => 'required|numeric|min:0',
            'distance_from_urc' => 'required|numeric|min:0',
            'is_active' => 'required|boolean',
        ]);

        $validatedData['planter_id'] = $planterId;

        $land = Land::create($validatedData);

        return redirect()->route('planters.index')->with('success', 'Land added successfully.');
    }
    public function update(Request $request, $planterId, $landId){
        $land = Land::where('planter_id', $planterId)->where('id',$landId)->firstOrFail();

        $validatedData = $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'required|string|max:255',
            'area_hectares' => 'required|numeric|min:0',
            'distance_from_urc' => 'required|numeric|min:0',
            'is_active' => 'required|boolean',
        ]);

        $land->update($validatedData);

        return redirect()->route('planters.view.land', ['planterId' => $planterId, 'landId' => $landId])->with('success', 'Land information updated successfully.');
    }
}
