<?php

namespace Database\Factories;

use App\Models\MillingPeriod;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\MillingPeriod>
 */
class MillingPeriodFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        static $sequence = 0;

        $weeksPerCropYear = 52;
        $weekIndex = $sequence % $weeksPerCropYear;

        $currentYear = (int) date('Y');
        $weekNo = $weekIndex + 1;

        // Keep generated dates inside the current year so seeded data is always recent.
        $startDate = (new \DateTimeImmutable("{$currentYear}-01-01"))
            ->modify('+' . ($weekIndex * 7) . ' days');
        $endDate = $startDate->modify('+6 days');

        $sequence++;


        return [
            'week_no' => $weekNo,
            'crop_year' => $currentYear . '-' . ($currentYear + 1),
            'start_date' => $startDate->format('Y-m-d'),
            'end_date' => $endDate->format('Y-m-d'),
            'sugar_factor' => fake()->randomFloat(16, 0.0000000000000001, 1),
            'mol_factor' => fake()->randomFloat(16, 0.0000000000000001, 1),
            'sugar_price' => fake()->randomFloat(4, 0.01, 100),
            'mol_price' => fake()->randomFloat(4, 0.01, 100),
        ];
    }
}
