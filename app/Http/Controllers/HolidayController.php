<?php

namespace App\Http\Controllers;

use App\Models\Holiday;
use Illuminate\Http\Request;

class HolidayController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'date' => 'required|date',
            'name' => 'required|string|max:255',
            'type' => 'required|in:regular,special_non_working',
        ]);

        Holiday::updateOrCreate(
            ['date' => $validated['date']],
            [
                'name' => $validated['name'],
                'type' => $validated['type'],
            ]
        );

        return redirect()->back()->with('success', "Successfully registered holiday '{$validated['name']}'!");
    }

    public function destroy($id)
    {
        $holiday = Holiday::findOrFail($id);
        $name = $holiday->name;
        $holiday->delete();

        return redirect()->back()->with('success', "Removed holiday '{$name}'.");
    }
}
