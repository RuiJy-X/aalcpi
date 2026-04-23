<?php

namespace Database\Seeders;

use App\Models\MillingPeriod;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class MillingPeriodSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        MillingPeriod::query()->delete();

        $baseWeekStart = Carbon::today()->startOfWeek(Carbon::MONDAY)->subWeeks(3);

        for ($weekOffset = 0; $weekOffset < 4; $weekOffset++) {
            $weekStart = $baseWeekStart->copy()->addWeeks($weekOffset);
            $weekNo = (int) $weekStart->format('W');
            $cropYear = $weekStart->year . '-' . ($weekStart->year + 1);
            $isPricedWeek = $weekOffset >= 2;

            MillingPeriod::create([
                'week_no' => $weekNo,
                'crop_year' => $cropYear,
                'start_date' => $weekStart->toDateString(),
                'end_date' => $weekStart->copy()->endOfWeek(Carbon::SUNDAY)->toDateString(),
                'sugar_factor' => 1,
                'mol_factor' => 1,
                'sugar_price' => $isPricedWeek ? fake()->randomFloat(4, 2000, 5000) : null,
                'mol_price' => $isPricedWeek ? fake()->randomFloat(4, 150, 400) : null,
            ]);
        }
    }
}
