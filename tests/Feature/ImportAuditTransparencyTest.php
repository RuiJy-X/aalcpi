<?php

use App\Models\ImportJob;
use App\Models\User;
use App\Support\Permissions;
use Database\Seeders\RolePermissionSeeder;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

test('import job status endpoint returns transparency audit context metadata', function () {
    $user = User::factory()->create();
    $user->assignRole(Permissions::SUPER_ADMIN_ROLE);

    $job = ImportJob::create([
        'user_id' => $user->id,
        'type' => 'bank_recon_internal',
        'status' => ImportJob::STATUS_DONE,
        'file_name' => 'internal_disbursements_w1.xlsx',
        'context' => [
            'heading_row' => 6,
            'headers_read' => ['check_no', 'check_amount', 'payee_name', 'audit_no', 'date_return'],
            'rows_read' => 150,
            'rows_saved' => 148,
            'rows_skipped' => 2,
            'warnings' => ['Row 12: Skipped row (Check Number and Audit Number are both empty).'],
            'duplicate_count' => 0,
        ],
    ]);

    $response = $this->actingAs($user)->getJson("/Imports/status/{$job->id}");

    $response->assertOk()
        ->assertJsonFragment([
            'id' => $job->id,
            'status' => 'done',
        ])
        ->assertJsonPath('context.heading_row', 6)
        ->assertJsonPath('context.rows_read', 150)
        ->assertJsonPath('context.rows_saved', 148)
        ->assertJsonPath('context.rows_skipped', 2);
});
