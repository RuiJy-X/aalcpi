<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::create([
            'name' => 'Juan Certifier',
            'email' => 'officer2@test.com',
            'password' => Hash::make('password123'),
            'role' => 'cert_officer',
        ]);

        User::create([
            'name' => 'Maria Employee',
            'email' => 'employee2@test.com',
            'password' => Hash::make('password123'),
            'role' => 'employee',
        ]);

        User::create([
            'name' => 'Admin Manager',
            'email' => 'admin2@test.com',
            'password' => Hash::make('password123'),
            'role' => 'manager',
        ]);
    }
}