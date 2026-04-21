<?php

namespace App\Http\Controllers;

use App\Imports\RawDataImport;
use App\Models\RawData;
use App\Services\DataTransformationService;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;
use Throwable;

class RawDataController extends Controller
{
    private function validatePayload(Request $request): array
    {
        return $request->validate([
            'crop_year' => ['required', 'string', 'max:20'],
            'date' => ['required', 'date'],
            'planter_code' => ['required', 'string', 'max:255', 'exists:planters,planter_code'],
            'gross_cw' => ['required', 'numeric', 'min:0'],
            'net_cw' => ['required', 'numeric', 'min:0'],
            'trucks' => ['required', 'integer', 'min:0'],
            'theoretical_lkg' => ['required', 'numeric', 'min:0'],
            'actual_lkg' => ['required', 'numeric', 'min:0'],
            'calculated_sugar' => ['required', 'numeric', 'min:0'],
            'trash' => ['required', 'numeric', 'min:0'],
            'Lkg_per_TC' => ['required', 'numeric', 'min:0'],
        ]);
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $rawData = RawData::with(['planter', 'production'])->orderBy('date', 'desc')->get();

        return Inertia::render('RawData/Index', [
            'rawData' => $rawData,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('RawData/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $this->validatePayload($request);

        RawData::create($validated);

        return redirect()->route('RawData.index')
            ->with('success', 'Raw data record created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        $rawData = RawData::with('planter')->findOrFail($id);

        return Inertia::render('RawData/View', [
            'rawData' => $rawData,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit($id)
    {
        $rawData = RawData::with('planter')->findOrFail($id);

        return Inertia::render('RawData/View', [
            'rawData' => $rawData,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $rawData = RawData::findOrFail($id);
        $validated = $this->validatePayload($request);

        $rawData->update($validated);

        return redirect()->route('RawData.show', $rawData->id)
            ->with('success', 'Raw data record updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(RawData $rawData)
    {
        $rawData->delete();

        return redirect()->route('RawData.index')
            ->with('success', 'Raw data record deleted successfully.');
    }

    public function bulkDestroy(Request $request)
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'distinct', 'exists:raw_data,id'],
        ]);

        RawData::whereIn('id', $validated['ids'])->delete();

        return redirect()->back()->with('success', 'Selected raw data records deleted successfully.');
    }

    public function import(Request $request)
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls,csv'],
        ]);

        Excel::import(new RawDataImport, $request->file('file'));

        return redirect()->back()->with('success', 'Raw data imported successfully.');
    }

    public function processAndEnrich(int $id, DataTransformationService $transformationService)
    {
        $rawData = RawData::findOrFail($id);

        if ($rawData->processing_status === RawData::STATUS_PROCESSED) {
            return redirect()->back()->with('success', 'Raw data record already processed.');
        }

        try {
            $production = $transformationService->processRawData($rawData);
        } catch (Throwable $exception) {
            report($exception);

            return redirect()->back()->withErrors([
                'process' => 'Unable to process and enrich this raw data record right now.',
            ]);
        }

        return redirect()->back()->with(
            'success',
            "Raw data record processed successfully. Linked Production ID: {$production->id}."
        );
    }
}
