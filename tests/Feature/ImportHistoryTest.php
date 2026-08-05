<?php

use App\Models\BankStatement;
use App\Models\ImportJob;
use App\Models\InternalDisbursements;
use App\Models\User;
use App\Support\Permissions;
use Database\Seeders\RolePermissionSeeder;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

test('authorized user can view import history log', function () {
    $user = User::factory()->create();
    $user->assignRole(Permissions::SUPER_ADMIN_ROLE);

    $job = ImportJob::create([
        'user_id' => $user->id,
        'type' => 'bank_recon_internal',
        'status' => ImportJob::STATUS_DONE,
        'file_name' => 'test_internal_disbursements.xlsx',
    ]);

    InternalDisbursements::create([
        'payee_name' => 'Test Payee',
        'check_no' => 'CHK-999',
        'check_amount' => 500.00,
        'date_issued' => '2026-08-01',
        'disbursement_week' => 1,
        'import_job_id' => $job->id,
    ]);

    $response = $this->actingAs($user)->getJson('/Imports/history?type=bank_recon');

    $response->assertOk()
        ->assertJsonFragment([
            'file_name' => 'test_internal_disbursements.xlsx',
            'record_count' => 1,
        ]);
});

test('authorized user can delete a specific import batch and its imported records', function () {
    $user = User::factory()->create();
    $user->assignRole(Permissions::SUPER_ADMIN_ROLE);

    $job = ImportJob::create([
        'user_id' => $user->id,
        'type' => 'bank_recon_bank',
        'status' => ImportJob::STATUS_DONE,
        'file_name' => 'bad_bank_statement.xlsx',
    ]);

    $bank = BankStatement::create([
        'tdate' => '2026-08-01',
        'checkno' => 'CHK-999',
        'debit' => 500.00,
        'running_balance' => 10000.00,
        'bank_date' => '2026-08-01',
        'import_job_id' => $job->id,
    ]);

    expect(BankStatement::where('import_job_id', $job->id)->count())->toBe(1);

    $response = $this->actingAs($user)->deleteJson("/Imports/history/{$job->id}");

    $response->assertOk();
    expect(BankStatement::where('id', $bank->id)->exists())->toBeFalse();
    expect(ImportJob::where('id', $job->id)->exists())->toBeFalse();
});
