<?php

namespace Database\Seeders;

use App\Models\User;
use App\Support\Permissions;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $admin = User::updateOrCreate(
            ['email' => 'admin@test.com'],
            [
                'name' => 'Administrator',
                'username' => 'admin',
                'password' => Hash::make('password123'),
            ]
        );
        $admin->syncRoles([Permissions::SUPER_ADMIN_ROLE]);

        $employee = User::updateOrCreate(
            ['email' => 'employee@test.com'],
            [
                'name' => 'Employee User',
                'username' => 'employee',
                'password' => Hash::make('password123'),
            ]
        );
        $employee->syncRoles(['employee']);
    }
}
