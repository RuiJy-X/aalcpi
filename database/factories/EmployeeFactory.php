<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Employee>
 */
class EmployeeFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'position' => fake()->jobTitle(),
            'employment_type' => fake()->randomElement(['Regular', 'Seasonal']),
            'base_salary' => fake()->randomFloat(2, 12000, 80000),
            'hire_date' => fake()->date(),
        ];
    }
}
