<?php

namespace Database\Seeders;

use App\Models\Certification;
use App\Models\Hacienda;
use App\Models\MillingPeriod;
use App\Models\Planter;
use App\Models\Production;
use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use App\Support\Permissions;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            RolePermissionSeeder::class,
            MillingPeriodSeeder::class,
        ]);

        // User::factory(10)->create();
        $testUser = User::factory()->create([
            'name' => 'Test User',
            'email' => 'admin@gmail.com',
            'password' => Hash::make('admin'),
        ]);
        $testUser->assignRole(Permissions::SUPER_ADMIN_ROLE);

        // Planters / haciendas / Production / Certifications
        $planters = Planter::factory()->count(50)->create();

        $haciendas = collect();
        foreach ($planters as $planter) {
            $haciendas->push(Hacienda::factory()->for($planter)->create());
        }

        $millingPeriods = MillingPeriod::query()
            ->orderBy('start_date')
            ->take(4)
            ->get();

        $productions = collect();
        foreach ($millingPeriods as $millingPeriod) {
            for ($i = 0; $i < 10; $i++) {
                $hacienda = $haciendas->random();
                $productionDate = Carbon::parse($millingPeriod->start_date)
                    ->addDays(fake()->numberBetween(0, 6));

                $productions->push(
                    Production::factory()
                        ->forPlanterhacienda($hacienda->planter, $hacienda)
                        ->state([
                            'milling_period_id' => $millingPeriod->id,
                            'production_date' => $productionDate->toDateString(),
                            'crop_year' => sprintf(
                                '%04d-%04d',
                                (int) $productionDate->format('Y'),
                                (int) $productionDate->format('Y') + 1,
                            ),
                        ])
                        ->create()
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
        $this->call([
            AdminSeeder::class,
            UserSeeder::class,
        ]);
    }
}
