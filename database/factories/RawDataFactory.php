<?php

namespace Database\Factories;

use App\Models\Planter;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\RawData>
 */
class RawDataFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $planterCode = Planter::query()->inRandomOrder()->value('planter_code')
            ?? Planter::factory()->create()->planter_code;

        $baseCropStartYear = fake()->numberBetween(2000, (int) date('Y'));
        $grossCw = fake()->randomFloat(3, 3, 100);
        $trash = fake()->randomFloat(3, 0, 10);
        $lkgPerTc = fake()->randomFloat(3, 0.5, 3.0);
        $calculatedSugar = $lkgPerTc * $grossCw;

        return [
            'planter_code' => $planterCode,
            'crop_year' => $baseCropStartYear . '-' . ($baseCropStartYear + 1),
            'date' => fake()->dateTimeBetween("{$baseCropStartYear}-01-01", "{$baseCropStartYear}-12-31")->format('Y-m-d'),
            'gross_cw' => $grossCw,
            'net_cw' => max(1, $grossCw - fake()->randomFloat(3, 0, 2)),
            'trucks' => fake()->numberBetween(1, 10),
            'theoretical_lkg' => fake()->randomFloat(2, 1, 500),
            'actual_lkg' => fake()->randomFloat(2, 0, 500),
            'calculated_sugar' => $calculatedSugar,
            'trash' => $trash,
            'Lkg_per_TC' => $lkgPerTc,
        ];
    }
}
