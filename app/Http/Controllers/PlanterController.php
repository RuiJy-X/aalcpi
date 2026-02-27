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

class PlanterController extends Controller
{
    //
    public function index()
    {
        $plans = Planter::all();

        $planter = Planter::with('lands')->get();
        $productions = Production::with('planter')->get();
        $certifications = Certification::with('planter')->get();
        $lands = Land::with('planter')->get();


        return Inertia::render('Planters/Index',['planters' => $planter, 'productions' => $productions, 'certifications' => $certifications, 'lands' => $lands ]);

    }

    public function create(){
        return Inertia::render('Planters/Create');
    }

    public function view($id)
    {
        $planter = Planter::with('lands')->findOrFail($id);
        $productions = Production::with('planter')
            ->where('planter_id', $id)
            ->get();
        $certifications = Certification::with('planter')
            ->where('planter_id', $id)
            ->get();

        return Inertia::render('Planters/View', [
            'planter' => $planter,
            'lands' => $planter->lands,
            'productions' => $productions,
            'certifications' => $certifications,
        ]);
    }

    public function viewProduction($planterId, $productionId)
    {
        $production = Production::with('planter')
            ->where('planter_id', $planterId)
            ->where('id', $productionId)
            ->firstOrFail();

        return Inertia::render('Planters/ViewProduction', [
            'production' => $production,
        ]);
    }

    public function data()
    {
        $planters = Planter::with('lands')->get();

        return response()->json($planters);
    }

    public function header()
    {
        return response()->json(Schema::getColumnListing('planters'));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'           => 'required|string|max:255',
            'address'        => 'required|string',
            'contact_number' => 'required|string',
            'tin_number'     => 'required|string|unique:planters,tin_number',
        ]);

        $planter = Planter::create($validated);

        return response()->json([
            'message' => 'Planter created successfully!',
            'planter' => $planter
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $planter = Planter::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'required|string',
            'contact_number' => 'required|string',
            'tin_number' => 'required|string'
        ]);

        $planter->update($validated);

        return response()->json([
            'message' => 'Planter updated successfully!',
            'planter' => $planter
        ]);
    }

    public function destroy($id)
    {
        $planter = Planter::findOrFail($id);
        $planter->delete();

        return response()->json([
            'message' => 'Planter deleted successfully!'
        ]);
    }
}
