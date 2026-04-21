<?php

namespace App\Http\Controllers;

use App\Models\Production;
use App\Models\Quedan;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class QuedanController extends Controller
{
    public function index(): Response
    {
        $pendingRegistration = Production::query()
            ->with(['planter', 'hacienda', 'quedan'])
            ->where(function ($query) {
                $query->whereDoesntHave('quedan')
                    ->orWhereHas('quedan', function ($quedanQuery) {
                        $quedanQuery->whereNull('serial_number');
                    });
            })
            ->orderByDesc('id')
            ->get()
            ->map(function (Production $production) {
                $production->planter_name = $production->planter?->name;
                $production->hacienda_name = $production->hacienda?->name;

                return $production;
            });

        $vaultInventory = Production::query()
            ->with(['planter', 'hacienda', 'quedan'])
            ->whereHas('quedan', function ($query) {
                $query->whereNotNull('serial_number');
            })
            ->orderByDesc('id')
            ->get()
            ->map(function (Production $production) {
                $production->planter_name = $production->planter?->name;
                $production->hacienda_name = $production->hacienda?->name;

                return $production;
            });

        return Inertia::render('Productions/QuedanManagement', [
            'pendingRegistration' => $pendingRegistration,
            'vaultInventory' => $vaultInventory,
        ]);
    }

    public function updateSerial(Request $request, int $productionId)
    {
        Production::query()->findOrFail($productionId);

        $quedan = Quedan::query()->firstOrCreate(
            ['production_id' => $productionId],
            ['status' => Quedan::STATUS_PENDING],
        );

        $validated = $request->validate([
            'serial_number' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('quedans', 'serial_number')->ignore($quedan->id),
            ],
            'remarks' => ['nullable', 'string', 'max:1000'],
        ]);

        $quedan->serial_number = $validated['serial_number'] ?? null;

        if (array_key_exists('remarks', $validated)) {
            $quedan->remarks = $validated['remarks'];
        }

        if ($quedan->serial_number !== null && trim((string) $quedan->serial_number) !== '') {
            $quedan->status = Quedan::STATUS_VAULTED;
        }

        $quedan->save();

        return redirect()->back()->with('success', 'Quedan serial number saved successfully.');
    }
}
