<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Imports\PlanterImport;
use App\Models\Planter;
use App\Models\Production;
use App\Models\Certification;
use App\Models\Hacienda;
use Inertia\Inertia;
use Illuminate\Support\Facades\Schema;
use Maatwebsite\Excel\Facades\Excel;

class PlanterController extends Controller
{
    public function index()
    {
        $planter = Planter::with('haciendas')->get();
        $productions = Production::with('planter')->get();
        $certifications = Certification::with('planter')->get();
        $haciendas = Hacienda::with('planter')->get();


        return Inertia::render('Planters/Index',['planters' => $planter, 'productions' => $productions, 'certifications' => $certifications, 'haciendas' => $haciendas ]);

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
        $planters = Planter::with('haciendas')->get();

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
            'haciendas' => 'nullable|array',
            'haciendas.*.hacienda_code' => 'required_with:haciendas|string|max:255',
            'haciendas.*.name' => 'required_with:haciendas|string|max:255',
            'haciendas.*.address' => 'required_with:haciendas|string|max:255',
            'haciendas.*.area_hectares' => 'required_with:haciendas|numeric|min:0',
            'haciendas.*.distance_from_urc' => 'required_with:haciendas|numeric|min:0',
            'haciendas.*.is_active' => 'required_with:haciendas|boolean',
        ]);



        $planter = Planter::create($validated);
        $validatedhaciendas = $validated['haciendas'] ?? [];
        $validatedhaciendas = array_values(array_filter($validatedhaciendas, function ($hacienda) {
            return !empty($hacienda['name'])
                || !empty($hacienda['address'])
                || isset($hacienda['area_hectares'])
                || isset($hacienda['distance_from_urc']);
        }));

        if (!empty($validatedhaciendas)) {
            $planter->haciendas()->createMany($validatedhaciendas);
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
        $planter = Planter::with(['haciendas', 'productions', 'certifications'])->findOrFail($id);

        $productions = Production::with(['planter', 'hacienda'])
            ->where('planter_id', $planter->id)
            ->orWhereHas('hacienda', fn ($query) => $query->where('planter_id', $planter->id))
            ->latest()
            ->get();
        $productions->each(function ($production) {
            $production->planter_name = $production->planter ? $production->planter->name : null;
            $production->hacienda_address = $production->hacienda ? $production->hacienda->address : null;
            $production->hacienda_name = $production->hacienda ? $production->hacienda->name : null;
        });

        $certifications = Certification::with(['planter', 'hacienda', 'production'])
            ->where('planter_id', $planter->id)
            ->orWhereHas('production', fn ($query) => $query->where('planter_id', $planter->id))
            ->latest()
            ->get();

        $haciendas = Hacienda::with('planter')->where('planter_id', $id)->get()->map(function ($hacienda) {
            $hacienda->planter_name = $hacienda->planter ? $hacienda->planter->name : '';
            return $hacienda;
        });

        return Inertia::render('Planters/View', [
            'planter' => $planter,
            'haciendas' => $haciendas,
            'productions' => $productions,
            'certifications' => $certifications,
        ]);
    }

    public function import(Request $request)
    {
        // Implementation for importing productions

        $file = $request->file('file');

        Excel::import(new PlanterImport, $file);

        return back()->with('success', 'Planter data imported successfully.');

    }

}
