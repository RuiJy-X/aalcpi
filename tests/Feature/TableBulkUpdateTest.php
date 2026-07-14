<?php

use App\Models\Employee;
use App\Models\Planter;
use App\Models\User;
use App\Support\Permissions;
use Database\Seeders\RolePermissionSeeder;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

test('planters bulk update persists cell edits', function () {
    $user = User::factory()->create();
    $user->assignRole(Permissions::SUPER_ADMIN_ROLE);

    $planter = Planter::factory()->create([
        'name' => 'Old Name',
        'address' => 'Old Address',
        'contact_number' => '111',
        'tin_number' => 'TIN-1',
    ]);

    $this->actingAs($user)
        ->patch(route('planters.bulk-update'), [
            'rows' => [
                [
                    'id' => $planter->id,
                    'name' => 'New Name',
                    'address' => 'New Address',
                    'contact_number' => '999',
                    'tin_number' => 'TIN-9',
                    'planter_code' => $planter->planter_code,
                ],
            ],
        ])
        ->assertRedirect();

    $planter->refresh();

    expect($planter->name)->toBe('New Name')
        ->and($planter->address)->toBe('New Address')
        ->and($planter->contact_number)->toBe('999')
        ->and($planter->tin_number)->toBe('TIN-9');
});

test('employees bulk update recalculates hourly rate from base salary', function () {
    $user = User::factory()->create();
    $user->assignRole(Permissions::SUPER_ADMIN_ROLE);

    $employee = Employee::query()->create([
        'employee_code' => 'E1',
        'name' => 'Worker',
        'position' => 'Staff',
        'employment_type' => 'Regular',
        'department' => 'Ops',
        'base_salary' => 24000,
        'hourly_rate' => 100,
        'address' => 'Addr',
        'tin' => 'TIN',
        'contact_number' => '123',
    ]);

    $this->actingAs($user)
        ->patch(route('employees.bulk-update'), [
            'rows' => [
                [
                    'id' => $employee->id,
                    'base_salary' => 48000,
                    'name' => 'Worker',
                    'employee_code' => 'E1',
                ],
            ],
        ])
        ->assertRedirect();

    $employee->refresh();

    expect((float) $employee->base_salary)->toBe(48000.0)
        ->and((float) $employee->hourly_rate)->toBeGreaterThan(100.0);
});

test('users bulk update updates name email username', function () {
    $admin = User::factory()->create();
    $admin->assignRole(Permissions::SUPER_ADMIN_ROLE);

    $target = User::factory()->create([
        'name' => 'Old',
        'email' => 'old@example.com',
        'username' => 'olduser',
    ]);

    $this->actingAs($admin)
        ->patch(route('users.bulk-update'), [
            'rows' => [
                [
                    'id' => $target->id,
                    'name' => 'New',
                    'email' => 'new@example.com',
                    'username' => 'newuser',
                ],
            ],
        ])
        ->assertRedirect();

    $target->refresh();

    expect($target->name)->toBe('New')
        ->and($target->email)->toBe('new@example.com')
        ->and($target->username)->toBe('newuser');
});
