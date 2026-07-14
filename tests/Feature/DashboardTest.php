<?php

use App\Models\User;
use App\Support\Permissions;
use Database\Seeders\RolePermissionSeeder;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

test('dashboard includes module summaries status tracking and activity', function () {
    $user = User::factory()->create();
    $user->assignRole(Permissions::SUPER_ADMIN_ROLE);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->has('module_summaries')
            ->has('status_tracking.productions')
            ->has('status_tracking.payroll')
            ->has('status_tracking.bank_reconciliation')
            ->has('status_tracking.imports')
            ->has('recent_activity')
            ->has('kpi_totals')
            ->has('leaderboard')
            ->has('milling_periods')
        );
});
