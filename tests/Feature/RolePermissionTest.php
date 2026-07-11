<?php

use App\Models\User;
use App\Support\Permissions;
use Database\Seeders\RolePermissionSeeder;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

function makeUserWithRole(string $role): User
{
    $user = User::factory()->create();
    $user->assignRole($role);

    return $user;
}

test('super admin can access user management', function () {
    $admin = makeUserWithRole(Permissions::SUPER_ADMIN_ROLE);

    $this->actingAs($admin)
        ->get(route('users.index'))
        ->assertOk();
});

test('user without permission cannot access user management', function () {
    $user = makeUserWithRole('employee');

    $this->actingAs($user)
        ->get(route('users.index'))
        ->assertForbidden();
});

test('manager can access employees', function () {
    $manager = makeUserWithRole('manager');

    $this->actingAs($manager)
        ->get(route('employees.index'))
        ->assertOk();
});

test('employee cannot access employees module', function () {
    $user = makeUserWithRole('employee');

    $this->actingAs($user)
        ->get(route('employees.index'))
        ->assertForbidden();
});

test('super admin can create a role with permissions', function () {
    $admin = makeUserWithRole(Permissions::SUPER_ADMIN_ROLE);

    $this->actingAs($admin)
        ->post(route('roles.store'), [
            'name' => 'auditor',
            'permissions' => ['planters.view', 'productions.view'],
        ])
        ->assertRedirect();

    $role = Role::findByName('auditor');
    expect($role->hasPermissionTo('planters.view'))->toBeTrue();
    expect($role->hasPermissionTo('productions.view'))->toBeTrue();
});

test('super admin can assign role and direct permissions to a user', function () {
    $admin = makeUserWithRole(Permissions::SUPER_ADMIN_ROLE);

    $this->actingAs($admin)
        ->post(route('users.store'), [
            'name' => 'New User',
            'email' => 'newuser@example.com',
            'username' => 'newuser',
            'password' => 'password123',
            'roles' => ['employee'],
            'permissions' => ['planters.create'],
        ])
        ->assertRedirect();

    $user = User::where('email', 'newuser@example.com')->first();
    expect($user)->not->toBeNull();
    expect($user->hasRole('employee'))->toBeTrue();
    expect($user->hasDirectPermission('planters.create'))->toBeTrue();
    expect($user->can('planters.view'))->toBeTrue(); // via employee role
    expect($user->can('planters.create'))->toBeTrue(); // direct
});

test('non super admin cannot assign super admin role', function () {
    $manager = makeUserWithRole('manager');

    $this->actingAs($manager)
        ->post(route('users.store'), [
            'name' => 'Hacker',
            'email' => 'hacker@example.com',
            'username' => 'hacker',
            'password' => 'password123',
            'roles' => [Permissions::SUPER_ADMIN_ROLE],
            'permissions' => [],
        ])
        ->assertForbidden();
});

test('super admin bypasses all permission checks', function () {
    $admin = makeUserWithRole(Permissions::SUPER_ADMIN_ROLE);

    expect($admin->can('users.delete'))->toBeTrue();
    expect($admin->can('roles.create'))->toBeTrue();
    expect($admin->can('payroll.generate'))->toBeTrue();
});

test('role permissions are seeded for default roles', function () {
    $employeeRole = Role::findByName('employee');
    $managerRole = Role::findByName('manager');
    $superAdminRole = Role::findByName(Permissions::SUPER_ADMIN_ROLE);

    expect($employeeRole->hasPermissionTo('planters.view'))->toBeTrue();
    expect($employeeRole->hasPermissionTo('users.view'))->toBeFalse();
    expect($managerRole->hasPermissionTo('users.view'))->toBeTrue();
    expect($superAdminRole->permissions)->not->toBeEmpty();
});

test('user with only view permission cannot create users', function () {
    $user = User::factory()->create();
    $user->givePermissionTo('users.view');

    $this->actingAs($user)
        ->get(route('users.index'))
        ->assertOk();

    $this->actingAs($user)
        ->post(route('users.store'), [
            'name' => 'Nope',
            'email' => 'nope@example.com',
            'username' => 'nope',
            'password' => 'password123',
            'roles' => [],
            'permissions' => [],
        ])
        ->assertForbidden();
});
