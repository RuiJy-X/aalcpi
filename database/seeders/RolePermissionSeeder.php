<?php

namespace Database\Seeders;

use App\Models\User;
use App\Support\Permissions;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        foreach (Permissions::all() as $permission) {
            Permission::findOrCreate($permission, 'web');
        }

        $superAdmin = Role::findOrCreate(Permissions::SUPER_ADMIN_ROLE, 'web');
        $superAdmin->syncPermissions(Permissions::all());

        foreach (Permissions::defaultRolePermissions() as $roleName => $permissionNames) {
            $role = Role::findOrCreate($roleName, 'web');
            $role->syncPermissions($permissionNames);
        }

        // Migrate legacy users.role column → Spatie roles when present
        User::query()
            ->whereNotNull('role')
            ->where('role', '!=', '')
            ->each(function (User $user): void {
                $legacy = match ($user->getAttributes()['role'] ?? null) {
                    'admin', 'administrator', 'super_admin' => Permissions::SUPER_ADMIN_ROLE,
                    'manager' => 'manager',
                    'cert_officer' => 'cert_officer',
                    'employee' => 'employee',
                    default => null,
                };

                if ($legacy && ! $user->hasRole($legacy)) {
                    $user->syncRoles([$legacy]);
                }
            });
    }
}
