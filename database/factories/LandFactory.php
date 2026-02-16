<?php

namespace Database\Factories;

use App\Models\Planter;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Land>
 */
class LandFactory extends Factory
{
    public function definition(): array
    {
        return [
            'planter_id' => Planter::factory(),
            'name' => fake()->words(2, true),
            'address' => fake()->address(),
            'area_hectares' => fake()->randomFloat(2, 0.1, 50),
            'distance_from_urc' => fake()->numberBetween(1, 200),
            'is_active' => fake()->boolean(90),
        ];
    }
}
