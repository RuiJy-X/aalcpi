<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\Planter;
use Inertia\Inertia;
use Illuminate\Support\Facades\Schema;

class PlanterController extends Controller
{
    //
    public function index()
    {
        return Inertia::render('Planters/Index');
    }

    public function get()
    {
        $planters = Planter::with('lands')->get();

        return response()->json($planters);
    }

    public function header()
    {
        return response()->json(Schema::getColumnListing('planters'));
    }

    public function create(Request $request)
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
