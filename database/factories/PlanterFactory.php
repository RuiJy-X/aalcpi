<?php

namespace Database\Factories;

use App\Models\Planter;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Planter>
 */
class PlanterFactory extends Factory
{
    public function definition(): array
    {
        return [
            'planter_code' => strtoupper(fake()->unique()->bothify('PLT-#####')),
            'name' => fake()->name(),
            'address' => fake()->address(),
            'contact_number' => fake()->phoneNumber(),
            'tin_number' => fake()->bothify('###-###-###-###'),
            'registration_date' => fake()->date(),
        ];
    }
}
