<?php

use App\Models\BankStatement;
use App\Models\InternalDisbursements;
use App\Models\ReconciliationWorkspace;
use App\Models\User;
use App\Support\Permissions;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Support\Facades\Schema;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

test('bank_statements table has bank_date column required by reconciliation view', function () {
    expect(Schema::hasColumn('bank_statements', 'bank_date'))->toBeTrue();
});

test('reconciliation workspace view is queryable', function () {
    expect(fn () => ReconciliationWorkspace::query()->limit(1)->get())
        ->not->toThrow(Throwable::class);
});

test('authorized user can view bank reconciliation index', function () {
    $user = User::factory()->create();
    $user->assignRole(Permissions::SUPER_ADMIN_ROLE);

    BankStatement::query()->create([
        'tdate' => now()->toDateString(),
        'checkno' => 'CHK-001',
        'branch_description' => 'Test branch',
        'partic' => 'Test partic',
        'debit' => 100.00,
        'credit' => null,
        'currency' => 'PHP',
        'running_balance' => 1000.000000,
        'bank_date' => now()->startOfMonth()->toDateString(),
        'is_duplicate' => false,
    ]);

    InternalDisbursements::query()->create([
        'payee_name' => 'Test Payee',
        'check_no' => 'CHK-002',
        'check_amount' => 50.00,
        'status' => 'Outstanding',
        'date_issued' => now()->toDateString(),
        'disbursement_week' => 1,
        'is_duplicate' => false,
    ]);

    $this->actingAs($user)
        ->get(route('bank_reconciliation.index'))
        ->assertOk();
});
