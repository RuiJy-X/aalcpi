<?php

namespace Database\Factories;

use App\Models\Attendance;
use App\Models\Employee;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Attendance>
 */
class AttendanceFactory extends Factory
{
    public function definition(): array
    {
        $hoursWorked = fake()->randomFloat(2, 0, 8);
        $overtime = $hoursWorked >= 8 ? fake()->randomFloat(2, 0, 4) : 0;

        return [
            'employee_id' => Employee::factory(),
            'date' => fake()->date(),
            'status' => fake()->randomElement(['present', 'absent', 'leave']),
            'hours_worked' => $hoursWorked,
            'overtime_hours' => $overtime,
        ];
    }

    public function forEmployee(Employee $employee): static
    {
        return $this->state(fn () => [
            'employee_id' => $employee->id,
        ]);
    }
}
