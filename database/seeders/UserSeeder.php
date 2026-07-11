<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $certOfficer = User::updateOrCreate(
            ['email' => 'officer2@test.com'],
            [
                'name' => 'Juan Certifier',
                'username' => 'juan_cert',
                'password' => Hash::make('password123'),
            ]
        );
        $certOfficer->syncRoles(['cert_officer']);

        $employee = User::updateOrCreate(
            ['email' => 'employee2@test.com'],
            [
                'name' => 'Maria Employee',
                'username' => 'maria_emp',
                'password' => Hash::make('password123'),
            ]
        );
        $employee->syncRoles(['employee']);

        $manager = User::updateOrCreate(
            ['email' => 'admin2@test.com'],
            [
                'name' => 'Admin Manager',
                'username' => 'admin_mgr',
                'password' => Hash::make('password123'),
            ]
        );
        $manager->syncRoles(['manager']);
    }
}
