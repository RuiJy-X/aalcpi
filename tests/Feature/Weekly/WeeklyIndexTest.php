<?php

use App\Models\User;
use App\Models\Weekly;
use App\Support\Permissions;
use Database\Seeders\RolePermissionSeeder;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

function createWeeklyPlanterFiles(string $planterCode, string $planterName, array $weeks): void
{
    foreach ($weeks as $week) {
        Weekly::query()->create([
            'crop_year' => '2025-2026',
            'week' => (string) $week,
            'planter_name' => $planterName,
            'planter_code' => $planterCode,
            'segment' => 'full',
            'page' => (string) $week,
            'file_location' => "weekly-pdfs/2025-2026/week-{$week}/{$planterCode}.pdf",
        ]);
    }
}

test('paginates by planter and includes every pdf for that planter', function () {
    $user = User::factory()->create();
    $user->assignRole(Permissions::SUPER_ADMIN_ROLE);

    // 4 PDFs for one planter — expanding must show all 4, not 1 page slice.
    createWeeklyPlanterFiles('9001', 'ENFARBCO PLANTER', [1, 2, 3, 4]);
    // Second planter so we can assert planter-level pagination.
    createWeeklyPlanterFiles('9002', 'OTHER PLANTER', [1]);

    $this->actingAs($user)
        ->get(route('weekly.index', ['per_page' => 1, 'page' => 1]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Weekly/Index')
            ->has('planter_groups', 1)
            ->where('pagination.total', 2)
            ->where('pagination.per_page', 1)
            ->where('pagination.current_page', 1)
            ->where('pagination.last_page', 2)
            ->where('planter_groups.0.planter_code', '9001')
            ->where('planter_groups.0.weeks', ['1', '2', '3', '4'])
            ->where('planter_groups.0.file_count', 4)
            ->has('planter_groups.0.files', 4)
        );

    $this->actingAs($user)
        ->get(route('weekly.index', ['per_page' => 1, 'page' => 2]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Weekly/Index')
            ->has('planter_groups', 1)
            ->where('planter_groups.0.planter_code', '9002')
            ->where('planter_groups.0.file_count', 1)
            ->has('planter_groups.0.files', 1)
        );
});

test('planter group lists all weeks even when week filter limits files', function () {
    $user = User::factory()->create();
    $user->assignRole(Permissions::SUPER_ADMIN_ROLE);

    createWeeklyPlanterFiles('9001', 'ENFARBCO PLANTER', [1, 2, 3, 4]);

    $this->actingAs($user)
        ->get(route('weekly.index', ['week' => '2']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Weekly/Index')
            ->has('planter_groups', 1)
            // Header still shows full coverage...
            ->where('planter_groups.0.weeks', ['1', '2', '3', '4'])
            // ...but only the filtered week files are listed.
            ->where('planter_groups.0.file_count', 1)
            ->has('planter_groups.0.files', 1)
            ->where('planter_groups.0.files.0.week', '2')
        );
});

test('weekly index returns planter groups when data exists without crashing', function () {
    $user = User::factory()->create();
    $user->assignRole(Permissions::SUPER_ADMIN_ROLE);

    createWeeklyPlanterFiles('1111', 'ABELLO ONE', [1, 2]);
    createWeeklyPlanterFiles('2222', 'ABELLO TWO', [1]);
    createWeeklyPlanterFiles('3333', 'OTHER PLANTER', [3]);

    $this->actingAs($user)
        ->get(route('weekly.index', ['per_page' => 10, 'page' => 1]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Weekly/Index')
            ->has('planter_groups')
            ->where('pagination.total', 3)
            ->where('stats.totalDocuments', 4)
            ->has('planter_groups.0.files')
            ->has('planter_groups.0.weeks')
        );

    // Search must still return a defined planter_groups array (never omit the key).
    $this->actingAs($user)
        ->get(route('weekly.index', ['search' => 'ABELLO']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Weekly/Index')
            ->has('planter_groups', 2)
            ->where('pagination.total', 2)
        );
});

test('planter week coverage is scoped to selected crop year', function () {
    $user = User::factory()->create();
    $user->assignRole(Permissions::SUPER_ADMIN_ROLE);

    Weekly::query()->create([
        'crop_year' => '2025-2026',
        'week' => '1',
        'planter_name' => 'ENFARBCO PLANTER',
        'planter_code' => '9001',
        'segment' => 'full',
        'page' => '1',
        'file_location' => 'weekly-pdfs/a.pdf',
    ]);

    Weekly::query()->create([
        'crop_year' => '2024-2025',
        'week' => '8',
        'planter_name' => 'ENFARBCO PLANTER',
        'planter_code' => '9001',
        'segment' => 'full',
        'page' => '1',
        'file_location' => 'weekly-pdfs/b.pdf',
    ]);

    $this->actingAs($user)
        ->get(route('weekly.index', ['crop_year' => '2025-2026']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('planter_groups.0.weeks', ['1'])
            ->where('planter_groups.0.crop_years', ['2025-2026'])
            ->where('planter_groups.0.file_count', 1)
        );
});
