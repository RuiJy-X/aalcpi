<?php

use App\Models\User;
use App\Support\Permissions;
use Database\Seeders\ProductionSeeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

test('production seeder creates all default roles and super admin user', function () {
    $this->seed(ProductionSeeder::class);

    expect(Role::findByName(Permissions::SUPER_ADMIN_ROLE))->not->toBeNull();
    expect(Role::findByName('manager'))->not->toBeNull();
    expect(Role::findByName('cert_officer'))->not->toBeNull();
    expect(Role::findByName('employee'))->not->toBeNull();

    $admin = User::where('email', 'admin@gmail.com')->first();
    expect($admin)->not->toBeNull();
    expect($admin->name)->toBe('Super Admin');
    expect($admin->username)->toBe('superadmin');
    expect(Hash::check('password123', $admin->password))->toBeTrue();
    expect($admin->hasRole(Permissions::SUPER_ADMIN_ROLE))->toBeTrue();
    expect($admin->can('users.delete'))->toBeTrue();
});
