<?php

use App\Models\ImportMapping;
use App\Models\User;
use App\Support\Permissions;
use Database\Seeders\RolePermissionSeeder;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

test('import mapping preview accepts bank_recon_internal and bank_recon_bank import types', function () {
    $user = User::factory()->create();
    $user->assignRole(Permissions::SUPER_ADMIN_ROLE);

    $this->actingAs($user);

    $headers = ['custom_chk_no', 'custom_amt', 'payee'];
    $signature = hash('sha256', json_encode($headers));

    $mapping = ImportMapping::create([
        'import_type' => 'bank_recon_internal',
        'header_signature' => $signature,
        'headers' => $headers,
        'mapping' => [
            'check_no' => 'custom_chk_no',
            'check_amount' => 'custom_amt',
            'payee_name' => 'payee',
        ],
        'created_by' => $user->id,
    ]);

    $response = $this->postJson('/Imports/mappings', [
        'import_type' => 'bank_recon_internal',
        'header_signature' => $signature,
        'headers' => $headers,
        'mapping' => [
            'check_no' => 'custom_chk_no',
            'check_amount' => 'custom_amt',
            'payee_name' => 'payee',
        ],
    ]);

    $response->assertOk()
        ->assertJsonStructure(['mapping_id']);
});
