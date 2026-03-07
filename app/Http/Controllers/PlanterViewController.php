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

class PlanterViewController extends Controller
{
    public function index($id)
    {
        $planter = Planter::with(['lands', 'productions', 'certifications'])->findOrFail($id);

        $productions = Production::with(['planter', 'land'])
            ->where('planter_id', $planter->id)
            ->orWhereHas('land', fn ($query) => $query->where('planter_id', $planter->id))
            ->latest()
            ->get();

        $certifications = Certification::with(['planter', 'land', 'production'])
            ->where('planter_id', $planter->id)
            ->orWhereHas('production', fn ($query) => $query->where('planter_id', $planter->id))
            ->latest()
            ->get();

        return Inertia::render('Planters/View', [
            'planter' => $planter,
            'lands' => $planter->lands,
            'productions' => $productions,
            'certifications' => $certifications,
        ]);
    }


    public function update(Request $request, $id)
    {
        $planter = Planter::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'required|string',
            'contact_number' => 'required|string',
            'tin_number' => 'required|string',
            'updated_at' => [(now()->toDateString() >= $request->updated_at) , 'nullable|date']
        ]);

        $planter->update($validated);


        return redirect()->route('planters.view.info', $planter->id)->with('success', 'Planter information updated successfully.');
    }
}
