<?php

namespace Database\Seeders;

use App\Models\Attendance;
use App\Models\Certification;
use App\Models\Employee;
use App\Models\Hacienda;
use App\Models\Payroll;
use App\Models\Planter;
use App\Models\Production;
use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();
        User::factory()->create([
            'name' => 'Test User',
            'email' => 'admin@gmail.com',
            'password' => Hash::make('admin'),
        ]);


        // Planters / haciendas / Production / Certifications
        $planters = Planter::factory()->count(50)->create();

        $haciendas = collect();
        foreach ($planters as $planter) {
            $haciendas->push(Hacienda::factory()->for($planter)->create());
        }

        $productions = collect();
        foreach ($haciendas as $hacienda) {
            for ($i = 0; $i < 5; $i++) {
                $productions->push(
                    Production::factory()->forPlanterhacienda($hacienda->planter, $hacienda)->create()
                );
            }
        }

        foreach ($productions as $production) {
            Certification::factory()->forProduction($production)->create();
        }

        // Employees / Attendance / Payroll
        // $employees = Employee::factory()->count(5)->create();

        // foreach ($employees as $employee) {
        //     Attendance::factory()->count(5)->forEmployee($employee)->create();
        //     Payroll::factory()->count(5)->forEmployee($employee)->create();
        // }
    }
}
