<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\MillingPeriod;
use Inertia\Inertia;
use Illuminate\Validation\Rule;

class MillingPeriodsController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $milling_periods = MillingPeriod::query()
            ->orderByDesc('crop_year')
            ->orderByDesc('week_no')
            ->get();

        return Inertia::render('MillingPeriods/Index', [
            'milling_periods' => $milling_periods
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('MillingPeriods/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'week_no' => [
                'required',
                'integer',
                'min:1',
                'max:53',
                Rule::unique('milling_periods')
                    ->where(fn ($query) => $query->where('crop_year', $request->input('crop_year'))),
            ],
            'crop_year' => ['required', 'string', 'max:255'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'sugar_factor' => ['required', 'numeric', 'min:0'],
            'mol_factor' => ['required', 'numeric', 'min:0'],
            'sugar_price' => ['nullable', 'numeric', 'min:0'],
            'mol_price' => ['nullable', 'numeric', 'min:0'],
        ]);

        $millingPeriod = MillingPeriod::create($validated);

        return redirect()
            ->route('MillingPeriods.show', $millingPeriod->id)
            ->with('success', 'Milling period created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $millingPeriod = MillingPeriod::findOrFail($id);

        return Inertia::render('MillingPeriods/Show', [
            'milling_period' => $millingPeriod,
            'isEditing' => false,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        $millingPeriod = MillingPeriod::findOrFail($id);

        return Inertia::render('MillingPeriods/Show', [
            'milling_period' => $millingPeriod,
            'isEditing' => true,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $millingPeriod = MillingPeriod::findOrFail($id);

        $validated = $request->validate([
            'week_no' => [
                'required',
                'integer',
                'min:1',
                'max:53',
                Rule::unique('milling_periods')
                    ->where(fn ($query) => $query->where('crop_year', $request->input('crop_year')))
                    ->ignore($millingPeriod->id),
            ],
            'crop_year' => ['required', 'string', 'max:255'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'sugar_factor' => ['required', 'numeric', 'min:0'],
            'mol_factor' => ['required', 'numeric', 'min:0'],
            'sugar_price' => ['nullable', 'numeric', 'min:0'],
            'mol_price' => ['nullable', 'numeric', 'min:0'],
        ]);

        $millingPeriod->update($validated);

        return redirect()
            ->route('MillingPeriods.show', $millingPeriod->id)
            ->with('success', 'Milling period updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $millingPeriod = MillingPeriod::findOrFail($id);
        $millingPeriod->delete();

        return redirect()
            ->route('MillingPeriods.index')
            ->with('success', 'Milling period deleted successfully.');
    }

    public function bulkDestroy(Request $request)
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'distinct', 'exists:milling_periods,id'],
        ]);

        MillingPeriod::whereIn('id', $validated['ids'])->delete();

        return redirect()->back()->with('success', 'Selected milling periods deleted successfully.');
    }
}
