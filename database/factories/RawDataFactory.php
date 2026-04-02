<?php

namespace Database\Factories;

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
        $baseCropStartYear = fake()->numberBetween(2000, (int) date('Y'));
        $grossCw = fake()->randomFloat(2, 10, 5000);
        return [
            'planter_code' => fake()->bothify('P-######'),
            'crop_year' => $baseCropStartYear . '-' . ($baseCropStartYear + 1),
            'date' => fake()->dateTimeBetween("{$baseCropStartYear}-01-01", "{$baseCropStartYear}-12-31")->format('Y-m-d'),
            'gross_cw' => $grossCw,
            'net_cw' => max(0, $grossCw - fake()->randomFloat(2, 0, 50)),
            'trucks' => fake()->numberBetween(1, 10),
            'theoretical_lkg' => fake()->randomFloat(2, 0, 5000),
            'actual_lkg' => fake()->randomFloat(2, 0, 5000),
        ];
    }
}
