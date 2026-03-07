<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Certification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class CertificationController extends Controller
{
    public function get()
    {
        return response()->json(Certification::with(['planters', 'lands', 'productions'])->latest()->get());

    }

    public function header()
    {
        return response()->json(Schema::getColumnListing('certifications'));
    }

    public function create(Request $request)
    {
        $validated = $request->validate([
            'planter_id'         => 'required|exists:planters,id',
            'land_id'            => 'required|exists:lands,id',
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

}
