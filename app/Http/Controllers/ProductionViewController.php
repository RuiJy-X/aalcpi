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

class ProductionViewController extends Controller
{
    public function index($planterId, $productionId)
    {
        $production = Production::with('planter')
            ->where('planter_id', $planterId)
            ->where('id', $productionId)
            ->firstOrFail();

        return Inertia::render('Planters/ViewProduction', [
            'production' => $production,
            'planterName' => $production->planter->name
        ]);
    }

    public function update(Request $request, $planterId, $productionId)
    {
        $production = Production::where('planter_id', $planterId)
            ->where('id', $productionId)
            ->firstOrFail();

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

        return redirect()->route('planters.view.production', ['planterId' => $planterId, 'productionId' => $productionId])
            ->with('success', 'Production information updated successfully.');
    }
}
                        