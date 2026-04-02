<?php

namespace App\Http\Controllers;

use App\Models\RawData;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class RawDataController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $rawData = RawData::all();
        return Inertia::render('RawData/Index', [
            'rawData' => $rawData,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(RawData $rawData)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(RawData $rawData)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, RawData $rawData)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(RawData $rawData)
    {
        //
    }
}
