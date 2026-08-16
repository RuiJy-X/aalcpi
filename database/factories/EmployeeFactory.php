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
        $baseSalary = fake()->randomFloat(2, 12000, 80000);

        return [
            'employee_code' => strtoupper(fake()->unique()->bothify('EMP-####')),
            'name' => fake()->name(),
            'position' => fake()->jobTitle(),
            'employment_type' => fake()->randomElement(['Regular', 'Seasonal']),
            'department' => fake()->randomElement(['Operations', 'Admin', 'Field']),
            'base_salary' => $baseSalary,
            'hourly_rate' => round($baseSalary / (30 * 8), 2),
            'address' => fake()->address(),
            'tin' => fake()->numerify('###-###-###-###'),
            'contact_number' => fake()->numerify('09#########'),
        ];
    }
}
