<?php

use App\Models\ImportJob;
use App\Models\User;
use App\Models\Weekly;
use App\Support\Permissions;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Support\Facades\Storage;
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

test('weekly show and download serve single planter pdfs', function () {
    $user = User::factory()->create();
    $user->assignRole(Permissions::SUPER_ADMIN_ROLE);

    Storage::fake('public');
    Storage::disk('public')->put('weekly-pdfs/2025-2026/week-1/legacy.pdf', '%PDF-1.4 legacy test pdf content');

    $weekly = Weekly::query()->create([
        'crop_year' => '2025-2026',
        'week' => '1',
        'planter_name' => 'HACIENDA TEST',
        'planter_code' => '9999',
        'segment' => 'full',
        'page' => '1',
        'file_location' => 'weekly-pdfs/2025-2026/week-1/legacy.pdf',
    ]);

    $showResponse = $this->actingAs($user)->get(route('weekly.show', $weekly));
    $showResponse->assertOk();

    $downloadResponse = $this->actingAs($user)->get(route('weekly.download', $weekly));
    $downloadResponse->assertOk();
    $downloadResponse->assertHeader('content-disposition', 'attachment; filename=hacienda_test_W1_CY2025-2026.pdf');
});

test('destroyByCropYearWeek deletes weekly records, import jobs, and storage directories', function () {
    $user = User::factory()->create();
    $user->assignRole(Permissions::SUPER_ADMIN_ROLE);

    Storage::fake('public');
    Storage::disk('public')->put('weekly-pdfs/2025-2026/week-5/master.pdf', 'fake master content');

    $importJob = ImportJob::create([
        'type' => 'weekly_pdf',
        'status' => ImportJob::STATUS_DONE,
        'context' => ['crop_year' => '2025-2026', 'week' => '5'],
    ]);

    Weekly::query()->create([
        'crop_year' => '2025-2026',
        'week' => '5',
        'planter_name' => 'DELETE ME PLANTER',
        'planter_code' => '8888',
        'segment' => 'full',
        'page' => '1',
        'file_location' => 'weekly-pdfs/2025-2026/week-5/master.pdf',
        'import_job_id' => $importJob->id,
    ]);

    $response = $this->actingAs($user)->delete(route('weekly.destroy-by-crop-year-week', [
        'crop_year' => '2025-2026',
        'week' => '5',
    ]));

    $response->assertRedirect();
    expect(Weekly::query()->where('crop_year', '2025-2026')->where('week', '5')->count())->toBe(0)
        ->and(ImportJob::find($importJob->id))->toBeNull();
});

test('clear deletes all weekly records and all weekly import jobs', function () {
    $user = User::factory()->create();
    $user->assignRole(Permissions::SUPER_ADMIN_ROLE);

    $job1 = ImportJob::create([
        'type' => 'weekly_pdf',
        'status' => ImportJob::STATUS_DONE,
        'context' => ['crop_year' => '2025-2026', 'week' => '1'],
    ]);

    Weekly::query()->create([
        'crop_year' => '2025-2026',
        'week' => '1',
        'planter_name' => 'CLEAR PLANTER',
        'planter_code' => '7777',
        'segment' => 'full',
        'page' => '1',
        'file_location' => 'weekly-pdfs/2025-2026/week-1/master.pdf',
        'import_job_id' => $job1->id,
    ]);

    $response = $this->actingAs($user)->delete(route('weekly.clear'));
    $response->assertRedirect();

    expect(Weekly::query()->count())->toBe(0)
        ->and(ImportJob::whereIn('type', ['weekly', 'weekly_pdf'])->count())->toBe(0);
});
