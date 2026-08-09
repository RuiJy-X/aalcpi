<?php

namespace Database\Seeders;

use App\Models\User;
use App\Support\Permissions;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class ProductionSeeder extends Seeder
{
    /**
     * Run the database seeds for production setup.
     */
    public function run(): void
    {
        // 1. Seed all permissions and default roles (super_admin, manager, cert_officer, employee)
        $this->call(RolePermissionSeeder::class);

        // 2. Create or update the initial Super Admin account
        $admin = User::updateOrCreate(
            ['email' => 'admin@gmail.com'],
            [
                'name' => 'Super Admin',
                'username' => 'superadmin',
                'password' => Hash::make('password123'),
            ]
        );

        $admin->syncRoles([Permissions::SUPER_ADMIN_ROLE]);
    }
}
