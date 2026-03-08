<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Production;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class ProductionController extends Controller
{

    public function index(){
        $productions = Production::with(['planter', 'land'])->get();
        return Inertia::render('Productions/Index', ['productions' => $productions]);
        
    }
    public function get()
    {
        return Production::with(['planter', 'land'])->latest()->get();
    }

    public function header()
    {
        return response()->json(Schema::getColumnListing('productions'));
    }

    public function create(Request $request)
    {
        $validated = $request->validate([
            'planter_id' => 'required|exists:planters,id',
            'land_id' => 'required|exists:lands,id',
            'production_year' => 'required|integer',
            'production_month' => 'required|string',
            'gross_cw' => 'required|numeric',
            'net_cw' => 'required|numeric',
            'trucks' => 'required|integer',
            'theoretical_lkg' => 'required|numeric',
            'actual_lkg' => 'required|numeric',
            'pshr_net_lkg' => 'required|numeric',
            'pdpa_lkg' => 'required|integer',
            'association_dues_lkg' => 'required|string',
            'actual_mol' => 'required|numeric',
            'pshr_net_mol' => 'required|numeric',
            'pdpa_mol' => 'required|numeric',
            'association_dues_mol' => 'required|numeric',
            'trans_code' => 'required|string',
            'transloading' => 'required|boolean',

        ]);

        $production = Production::create($validated);
        return response()->json(['message' => 'Record created!', 'data' => $production], 201);
    }


}
