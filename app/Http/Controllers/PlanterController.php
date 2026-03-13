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

    public function viewCertificates($planterId, $certificateId){
        $certificate = Certification::with('planter')->where('planter_id', $planterId)->where('id',$certificateId)->firstorFail();
        return Inertia::render('Planters/ViewCertificates', ['certificate'=> $certificate, 'planterName' => $certificate->planter->name]);
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
            'planter_code' => 'required|string|max:255|unique:planters,planter_code',
            'name'           => 'required|string|max:255',
            'address'        => 'required|string',
            'contact_number' => 'required|string',
            'tin_number'     => 'required|string|unique:planters,tin_number',
            'registration_date' => (now()->toDateString() >= $request->registration_date) ? 'required|date' : 'required|date|before_or_equal:today',
            'lands' => 'nullable|array',
            'lands.*.name' => 'required_with:lands|string|max:255',
            'lands.*.address' => 'required_with:lands|string|max:255',
            'lands.*.area_hectares' => 'required_with:lands|numeric|min:0',
            'lands.*.distance_from_urc' => 'required_with:lands|numeric|min:0',
            'lands.*.is_active' => 'required_with:lands|boolean',
        ]);



        $planter = Planter::create($validated);
        $validatedLands = $validated['lands'] ?? [];
        $validatedLands = array_values(array_filter($validatedLands, function ($land) {
            return !empty($land['name'])
                || !empty($land['address'])
                || isset($land['area_hectares'])
                || isset($land['distance_from_urc']);
        }));

        if (!empty($validatedLands)) {
            $planter->lands()->createMany($validatedLands);
        }

        return redirect()->back()->with('success', 'Planter created successfully!');


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


        return redirect()->route('planters.show', $planter->id)->with('success', 'Planter information updated successfully.');
    }

    public function destroy($id)
    {
        $planter = Planter::findOrFail($id);
        $planter->delete();

        return redirect()->route('planters.index')->with('success', 'Planter deleted successfully.');
    }

    public function bulkDestroy(Request $request)
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'distinct', 'exists:planters,id'],
        ]);

        Planter::whereIn('id', $validated['ids'])->delete();

        return redirect()->back()->with('success', 'Selected planters deleted successfully.');
    }

    public function show($id)
    {
        $planter = Planter::with(['lands', 'productions', 'certifications'])->findOrFail($id);

        $productions = Production::with(['planter', 'land'])
            ->where('planter_id', $planter->id)
            ->orWhereHas('land', fn ($query) => $query->where('planter_id', $planter->id))
            ->latest()
            ->get();
        $productions->each(function ($production) {
            $production->planter_name = $production->planter ? $production->planter->name : null;
            $production->land_address = $production->land ? $production->land->address : null;
            $production->land_name = $production->land ? $production->land->name : null;
        });

        $certifications = Certification::with(['planter', 'land', 'production'])
            ->where('planter_id', $planter->id)
            ->orWhereHas('production', fn ($query) => $query->where('planter_id', $planter->id))
            ->latest()
            ->get();

        $lands = Land::with('planter')->where('planter_id', $id)->get()->map(function ($land) {
            $land->planter_name = $land->planter ? $land->planter->name : '';
            return $land;
        });

        return Inertia::render('Planters/View', [
            'planter' => $planter,
            'lands' => $lands,
            'productions' => $productions,
            'certifications' => $certifications,
        ]);
    }
}
