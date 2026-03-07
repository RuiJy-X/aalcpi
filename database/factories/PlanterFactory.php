<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Planter>
 */
class PlanterFactory extends Factory
{
    public function definition(): array
    {
        return [
            'planter_code' => strtoupper(fake()->bothify('PLT-#####')),
            'name' => fake()->name(),
            'address' => fake()->address(),
            'contact_number' => fake()->phoneNumber(),
            'tin_number' => fake()->optional()->bothify('###-###-###-###'),
            'registration_date' => fake()->date(),
        ];
    }
}
