<?php

use App\Models\BankStatement;
use App\Models\ImportJob;
use App\Models\InternalDisbursements;
use App\Models\Production;
use App\Models\User;
use App\Models\Weekly;
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

test('authorized user can view production import history and audit details', function () {
    $user = User::factory()->create();
    $user->assignRole(Permissions::SUPER_ADMIN_ROLE);

    $job = ImportJob::create([
        'user_id' => $user->id,
        'type' => 'productions_excel',
        'status' => ImportJob::STATUS_DONE,
        'file_name' => 'production_data_2025_2026.xlsx',
        'context' => [
            'crop_year' => '2025-2026',
            'composite_sugar_price' => 2800.50,
            'composite_molasses_price' => 1200.00,
            'rows_read' => 50,
            'rows_saved' => 48,
            'rows_skipped' => 2,
            'planters_created' => 5,
            'haciendas_created' => 10,
            'warnings' => ['Row 5: Skipped empty planter code.'],
        ],
    ]);

    Production::create([
        'import_job_id' => $job->id,
        'planter_code' => '00101',
        'hacienda_code' => '00201',
        'crop_year' => '2025-2026',
        'trans_code' => 'TRX-001',
        'gross_cw' => 100,
        'net_cw' => 90,
        'trucks' => 1,
        'theoretical_lkg' => 80,
        'actual_lkg' => 85,
        'pshr_net_lkg' => 54.4,
        'pdpa_lkg' => 0,
        'association_dues_lkg' => 0,
        'actual_mol' => 2.5,
        'pshr_net_mol' => 1.6,
        'pdpa_mol' => 0,
        'association_dues_mol' => 0,
    ]);

    $response = $this->actingAs($user)->getJson('/Imports/history?type=productions');

    $response->assertOk()
        ->assertJsonFragment([
            'file_name' => 'production_data_2025_2026.xlsx',
            'record_count' => 1,
        ]);

    expect($response->json('jobs.0.context.crop_year'))->toBe('2025-2026');
    expect($response->json('jobs.0.context.rows_saved'))->toBe(48);
    expect($response->json('jobs.0.context.planters_created'))->toBe(5);
});

test('production import audit fallback works for legacy import jobs with null import_job_id', function () {
    $user = User::factory()->create();
    $user->assignRole(Permissions::SUPER_ADMIN_ROLE);

    $job = ImportJob::create([
        'user_id' => $user->id,
        'type' => 'productions_excel',
        'status' => ImportJob::STATUS_DONE,
        'file_name' => 'legacy_production.xlsx',
        'context' => [
            'crop_year' => '2024-2025',
        ],
    ]);

    Production::create([
        'import_job_id' => null,
        'planter_code' => '00777',
        'hacienda_code' => '00666',
        'crop_year' => '2024-2025',
        'trans_code' => 'TRX-LEGACY',
        'gross_cw' => 50,
        'net_cw' => 45,
        'trucks' => 1,
        'theoretical_lkg' => 40,
        'actual_lkg' => 42,
        'pshr_net_lkg' => 26.8,
        'pdpa_lkg' => 0,
        'association_dues_lkg' => 0,
        'actual_mol' => 1.2,
        'pshr_net_mol' => 0.8,
        'pdpa_mol' => 0,
        'association_dues_mol' => 0,
    ]);

    $response = $this->actingAs($user)->getJson('/Imports/history?type=productions');

    $response->assertOk();
    expect($response->json('jobs.0.record_count'))->toBe(1);
    expect($response->json('jobs.0.context.rows_saved'))->toBe(1);
    expect($response->json('jobs.0.context.rows_read'))->toBe(1);
});

test('authorized user can view weekly pdf import history and audit details', function () {
    $user = User::factory()->create();
    $user->assignRole(Permissions::SUPER_ADMIN_ROLE);

    $job = ImportJob::create([
        'user_id' => $user->id,
        'type' => 'weekly_pdf',
        'status' => ImportJob::STATUS_DONE,
        'file_name' => 'weekly_planter_reports_wk12.pdf',
        'context' => [
            'crop_year' => '2025-2026',
            'week' => '12',
            'rows_read' => 15,
            'rows_saved' => 15,
            'unique_planters' => 3,
            'extracted_planters' => ['00101 - Planter A', '00102 - Planter B'],
        ],
    ]);

    Weekly::create([
        'import_job_id' => $job->id,
        'crop_year' => '2025-2026',
        'week' => '12',
        'planter_code' => '00101',
        'planter_name' => 'Planter A',
        'segment' => 'full',
        'page' => '1',
        'file_location' => 'weekly-pdfs/2025-2026/week-12/planter-a.pdf',
    ]);

    $response = $this->actingAs($user)->getJson('/Imports/history?type=weekly');

    $response->assertOk()
        ->assertJsonFragment([
            'file_name' => 'weekly_planter_reports_wk12.pdf',
            'record_count' => 1,
        ]);

    expect($response->json('jobs.0.context.week'))->toBe('12');
    expect($response->json('jobs.0.context.unique_planters'))->toBe(3);
});

test('authorized user can delete production and weekly pdf import history batches', function () {
    $user = User::factory()->create();
    $user->assignRole(Permissions::SUPER_ADMIN_ROLE);

    $prodJob = ImportJob::create([
        'user_id' => $user->id,
        'type' => 'productions_excel',
        'status' => ImportJob::STATUS_DONE,
        'file_name' => 'prod.xlsx',
    ]);

    $prod = Production::create([
        'import_job_id' => $prodJob->id,
        'planter_code' => '00999',
        'hacienda_code' => '00888',
        'crop_year' => '2025-2026',
        'trans_code' => 'TRX-TEST',
        'gross_cw' => 10,
        'net_cw' => 10,
        'trucks' => 1,
        'theoretical_lkg' => 10,
        'actual_lkg' => 10,
        'pshr_net_lkg' => 6.4,
        'pdpa_lkg' => 0,
        'association_dues_lkg' => 0,
        'actual_mol' => 0.5,
        'pshr_net_mol' => 0.3,
        'pdpa_mol' => 0,
        'association_dues_mol' => 0,
    ]);

    $response = $this->actingAs($user)->deleteJson("/Imports/history/{$prodJob->id}");
    $response->assertOk();

    expect(Production::where('id', $prod->id)->exists())->toBeFalse();
    expect(ImportJob::where('id', $prodJob->id)->exists())->toBeFalse();
});
