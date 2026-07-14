<?php

use App\Models\Hacienda;
use App\Models\Planter;
use App\Models\Production;
use App\Models\User;
use App\Support\Permissions;
use Database\Seeders\RolePermissionSeeder;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

/**
 * Create a production using only columns present in the migrated schema
 * (the factory may include fields not yet migrated in tests).
 */
function makeProduction(array $overrides = []): Production
{
    $planter = $overrides['planter'] ?? Planter::factory()->create([
        'planter_code' => $overrides['planter_code'] ?? 'P100',
    ]);
    unset($overrides['planter']);

    $hacienda = $overrides['hacienda'] ?? Hacienda::factory()->create([
        'planter_id' => $planter->id,
        'hacienda_code' => $overrides['hacienda_code'] ?? 'H100',
    ]);
    unset($overrides['hacienda']);

    return Production::query()->create(array_merge([
        'planter_id' => $planter->id,
        'hacienda_id' => $hacienda->id,
        'planter_code' => $planter->planter_code,
        'hacienda_code' => $hacienda->hacienda_code,
        'crop_year' => '2025-2026',
        'trans_code' => 'TRN-0001',
        'gross_cw' => 10,
        'net_cw' => 9,
        'trucks' => 1,
        'theoretical_lkg' => 8,
        'actual_lkg' => 8,
        'pshr_net_lkg' => 5,
        'pdpa_lkg' => 0.1,
        'association_dues_lkg' => 0.05,
        'actual_mol' => 100,
        'pshr_net_mol' => 60,
        'pdpa_mol' => 1,
        'association_dues_mol' => 0.5,
        'composite_sugar_price' => 1000,
        'composite_molasses_price' => 500,
        'transloading' => false,
        'status' => 'draft',
    ], $overrides));
}

test('authorized user can bulk update production cells from the datatable', function () {
    $user = User::factory()->create();
    $user->assignRole(Permissions::SUPER_ADMIN_ROLE);

    $production = makeProduction([
        'gross_cw' => 10,
        'net_cw' => 9,
        'trucks' => 1,
        'status' => 'draft',
        'transloading' => false,
        'trans_code' => 'OLD-CODE',
    ]);

    $this->actingAs($user)
        ->patch(route('productions.bulk-update'), [
            'rows' => [
                [
                    'id' => $production->id,
                    'gross_cw' => 15.5,
                    'net_cw' => 14.25,
                    'trucks' => 3,
                    'status' => 'completed',
                    'transloading' => true,
                    'trans_code' => 'NEW-CODE',
                    'crop_year' => '2025-2026',
                    'planter_code' => $production->planter_code,
                    'hacienda_code' => $production->hacienda_code,
                ],
            ],
        ])
        ->assertRedirect();

    $production->refresh();

    expect((float) $production->gross_cw)->toBe(15.5)
        ->and((float) $production->net_cw)->toBe(14.25)
        ->and((int) $production->trucks)->toBe(3)
        ->and($production->status)->toBe('completed')
        ->and((bool) $production->transloading)->toBeTrue()
        ->and($production->trans_code)->toBe('NEW-CODE');
});

test('bulk update resolves planter and hacienda ids from codes', function () {
    $user = User::factory()->create();
    $user->assignRole(Permissions::SUPER_ADMIN_ROLE);

    $planterA = Planter::factory()->create(['planter_code' => 'PA']);
    $haciendaA = Hacienda::factory()->create([
        'planter_id' => $planterA->id,
        'hacienda_code' => 'HA',
    ]);

    $planterB = Planter::factory()->create(['planter_code' => 'PB']);
    $haciendaB = Hacienda::factory()->create([
        'planter_id' => $planterB->id,
        'hacienda_code' => 'HB',
    ]);

    $production = makeProduction([
        'planter' => $planterA,
        'hacienda' => $haciendaA,
        'planter_code' => 'PA',
        'hacienda_code' => 'HA',
        'crop_year' => '2025-2026',
    ]);

    $this->actingAs($user)
        ->patch(route('productions.bulk-update'), [
            'rows' => [
                [
                    'id' => $production->id,
                    'planter_code' => 'PB',
                    'hacienda_code' => 'HB',
                ],
            ],
        ])
        ->assertRedirect();

    $production->refresh();

    expect($production->planter_code)->toBe('PB')
        ->and($production->hacienda_code)->toBe('HB')
        ->and((int) $production->planter_id)->toBe($planterB->id)
        ->and((int) $production->hacienda_id)->toBe($haciendaB->id);
});

test('user without update permission cannot bulk update productions', function () {
    $user = User::factory()->create();
    $user->assignRole('employee');

    $production = makeProduction([
        'crop_year' => '2025-2026',
        'gross_cw' => 1,
    ]);

    $this->actingAs($user)
        ->patch(route('productions.bulk-update'), [
            'rows' => [
                [
                    'id' => $production->id,
                    'gross_cw' => 99,
                ],
            ],
        ])
        ->assertForbidden();

    expect((float) $production->fresh()->gross_cw)->toBe(1.0);
});
