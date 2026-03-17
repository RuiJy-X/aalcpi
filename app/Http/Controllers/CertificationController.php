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
class CertificationController extends Controller
{

    public function index()
    {
       $certifications = Certification::with('planter')->get();
        return Inertia::render('Certifications/Index', ['certifications' => $certifications]);
    }
    public function get()
    {
        return response()->json(Certification::with(['planter', 'hacienda', 'production'])->latest()->get());

    }

    public function header()
    {
        return response()->json(Schema::getColumnListing('certifications'));
    }

    public function create(Request $request)
    {
        $validated = $request->validate([
            'planter_id'         => 'required|exists:planters,id',
            'hacienda_id'            => 'required|exists:haciendas,id',
            'production_id'      => 'required|exists:productions,id',
            'certification_type' => 'required|string',
            'issue_date'         => 'required|date',
            'status'             => 'required|string',
        ]);

        $certification = Certification::create($validated);
        return response()->json(['message' => 'Certification created!', 'data' => $certification], 201);
    }

    public function update(Request $request, $id)
    {
        $certification = Certification::findOrFail($id);

        $validated = $request->validate([
            'certification_type' => 'sometimes|string',
            'issue_date'         => 'sometimes|date',
            'status'             => 'sometimes|string',
        ]);

        $certification->update($validated);
        return response()->json(['message' => 'Certification updated successfully']);
    }

    public function destroy($id)
    {
        Certification::findOrFail($id)->delete();
        return response()->json(['message' => 'Record deleted']);
    }

    public function bulkDestroy(Request $request)
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'distinct', 'exists:certifications,id'],
        ]);

        Certification::whereIn('id', $validated['ids'])->delete();

        return redirect()->back()->with('success', 'Selected certifications deleted successfully.');
    }

}
