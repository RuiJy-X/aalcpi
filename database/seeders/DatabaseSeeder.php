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


        // Employees / Attendance / Payroll
        // $employees = Employee::factory()->count(5)->create();

        // foreach ($employees as $employee) {
        //     Attendance::factory()->count(5)->forEmployee($employee)->create();
        //     Payroll::factory()->count(5)->forEmployee($employee)->create();
        // }
        $this->call([
            AdminSeeder::class,
            UserSeeder::class,
            EmployeeSeeder::class,
            AttendanceSeeder::class,

        ]);
    }
}
