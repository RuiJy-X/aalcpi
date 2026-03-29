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
        static $baseCropStartYear = null;

        if ($baseCropStartYear === null) {
            $baseCropStartYear = fake()->numberBetween(2000, (int) date('Y'));
        }

        $weeksPerCropYear = 24;
        $weekIndex = $sequence % $weeksPerCropYear;
        $cropYearOffset = intdiv($sequence, $weeksPerCropYear);

        $cropStartYear = $baseCropStartYear + $cropYearOffset;
        $weekNo = $weekIndex + 1;

        // Week 1 starts on Aug 1; each next week starts 7 days after the previous one.
        $startDate = (new \DateTimeImmutable("{$cropStartYear}-08-01"))
            ->modify('+' . ($weekIndex * 7) . ' days');
        $endDate = $startDate->modify('+7 days');

        $sequence++;


        return [
            'week_no' => $weekNo,
            'crop_year' => $cropStartYear . '-' . ($cropStartYear + 1),
            'start_date' => $startDate->format('Y-m-d'),
            'end_date' => $endDate->format('Y-m-d'),
            'sugar_factor' => fake()->randomFloat(16, 0.0000000000000001, 1),
            'mol_factor' => fake()->randomFloat(16, 0.0000000000000001, 1),
            'sugar_price' => fake()->randomFloat(4, 0.01, 100),
            'mol_price' => fake()->randomFloat(4, 0.01, 100),
        ];
    }
}
