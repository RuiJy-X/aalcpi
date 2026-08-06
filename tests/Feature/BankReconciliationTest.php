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

test('bank reconciliation kpiStats metrics accurately match all categories', function () {
    $user = User::factory()->create();
    $user->assignRole(Permissions::SUPER_ADMIN_ROLE);

    // 1. Matched entry
    $bankMatched = BankStatement::query()->create([
        'tdate' => '2026-08-01',
        'checkno' => 'CHK-MATCH-1',
        'debit' => 500.00,
        'running_balance' => 5000.00,
        'bank_date' => '2026-08-01',
        'is_duplicate' => false,
    ]);
    InternalDisbursements::query()->create([
        'payee_name' => 'Payee Matched',
        'check_no' => 'CHK-MATCH-1',
        'check_amount' => 500.00,
        'bank_statement_id' => $bankMatched->id,
        'date_issued' => '2026-08-01',
        'disbursement_week' => 1,
        'is_duplicate' => false,
    ]);

    // 2. Amount Mismatch entry
    $bankMismatch = BankStatement::query()->create([
        'tdate' => '2026-08-02',
        'checkno' => 'CHK-MISMATCH-1',
        'debit' => 600.00,
        'running_balance' => 4400.00,
        'bank_date' => '2026-08-01',
        'is_duplicate' => false,
    ]);
    InternalDisbursements::query()->create([
        'payee_name' => 'Payee Mismatch',
        'check_no' => 'CHK-MISMATCH-1',
        'check_amount' => 550.00,
        'bank_statement_id' => $bankMismatch->id,
        'date_issued' => '2026-08-02',
        'disbursement_week' => 1,
        'is_duplicate' => false,
    ]);

    // 3. Outstanding entry
    InternalDisbursements::query()->create([
        'payee_name' => 'Payee Outstanding',
        'check_no' => 'CHK-OUT-1',
        'check_amount' => 250.00,
        'bank_statement_id' => null,
        'date_issued' => '2026-08-03',
        'disbursement_week' => 1,
        'is_duplicate' => false,
    ]);

    // 4. Unrecorded Bank entry
    BankStatement::query()->create([
        'tdate' => '2026-08-04',
        'checkno' => 'CHK-UNREC-1',
        'debit' => 300.00,
        'running_balance' => 4100.00,
        'bank_date' => '2026-08-01',
        'is_duplicate' => false,
    ]);

    // 5. Duplicate entry
    InternalDisbursements::query()->create([
        'payee_name' => 'Payee Duplicate',
        'check_no' => 'CHK-DUP-1',
        'check_amount' => 100.00,
        'bank_statement_id' => null,
        'date_issued' => '2026-08-05',
        'disbursement_week' => 1,
        'is_duplicate' => true,
    ]);

    $response = $this->actingAs($user)->get(route('bank_reconciliation.index'));
    $response->assertOk();

    /** @var array<string, int> $kpiStats */
    $kpiStats = $response->viewData('page')['props']['kpiStats'];

    expect($kpiStats['matched'])->toBe(1);
    expect($kpiStats['mismatched'])->toBe(1);
    expect($kpiStats['outstanding'])->toBe(2); // OUT-1 + DUP-1
    expect($kpiStats['unrecorded'])->toBe(1);
    expect($kpiStats['duplicates'])->toBe(1);
});

test('authorized user can fetch outstanding checks grouped by month', function () {
    $user = User::factory()->create();
    $user->assignRole(Permissions::SUPER_ADMIN_ROLE);

    // Create 2 outstanding checks in Jan 2026 and 1 in Feb 2026
    InternalDisbursements::query()->create([
        'payee_name' => 'Payee Jan 1',
        'check_no' => 'CHK-JAN-001',
        'check_amount' => 1000.00,
        'date_issued' => '2026-01-10',
        'disbursement_week' => 1,
        'is_duplicate' => false,
    ]);

    InternalDisbursements::query()->create([
        'payee_name' => 'Payee Jan 2',
        'check_no' => 'CHK-JAN-002',
        'check_amount' => 2000.00,
        'date_issued' => '2026-01-20',
        'disbursement_week' => 2,
        'is_duplicate' => false,
    ]);

    InternalDisbursements::query()->create([
        'payee_name' => 'Payee Feb 1',
        'check_no' => 'CHK-FEB-001',
        'check_amount' => 3000.00,
        'date_issued' => '2026-02-05',
        'disbursement_week' => 6,
        'is_duplicate' => false,
    ]);

    $response = $this->actingAs($user)
        ->get(route('bank_reconciliation.outstanding-checks', [
            'date_from' => '2026-01-01',
            'date_to' => '2026-02-28',
        ]));

    $response->assertOk()
        ->assertJsonStructure([
            'date_from',
            'date_to',
            'months' => [
                '*' => [
                    'month_key',
                    'month_label',
                    'items' => [
                        '*' => [
                            'no',
                            'date',
                            'raw_date',
                            'payee_name',
                            'check_no',
                            'amount',
                            'date_cleared',
                        ],
                    ],
                    'subtotal',
                ],
            ],
            'grand_total',
            'total_count',
        ]);

    $data = $response->json();
    expect($data['total_count'])->toBe(3);
    expect($data['grand_total'])->toBe(6000.0);
    expect(count($data['months']))->toBe(2);

    // Jan month check (item no resets per month)
    $janMonth = $data['months'][0];
    expect($janMonth['month_label'])->toBe('January 2026');
    expect(count($janMonth['items']))->toBe(2);
    expect($janMonth['items'][0]['no'])->toBe(1);
    expect($janMonth['items'][1]['no'])->toBe(2);
    expect($janMonth['items'][0]['date_cleared'])->toBe('');
    expect($janMonth['subtotal'])->toBe(3000.0);

    // Feb month check (item no resets to 1)
    $febMonth = $data['months'][1];
    expect($febMonth['month_label'])->toBe('February 2026');
    expect(count($febMonth['items']))->toBe(1);
    expect($febMonth['items'][0]['no'])->toBe(1);
    expect($febMonth['items'][0]['date_cleared'])->toBe('');
    expect($febMonth['subtotal'])->toBe(3000.0);
});

test('authorized user can stream outstanding checks pdf report', function () {
    $user = User::factory()->create();
    $user->assignRole(Permissions::SUPER_ADMIN_ROLE);

    InternalDisbursements::query()->create([
        'payee_name' => 'PDF Test Payee',
        'check_no' => 'CHK-PDF-001',
        'check_amount' => 1500.00,
        'date_issued' => '2026-03-15',
        'disbursement_week' => 10,
        'is_duplicate' => false,
    ]);

    $response = $this->actingAs($user)
        ->get(route('bank_reconciliation.outstanding-checks-pdf', [
            'date_from' => '2026-03-01',
            'date_to' => '2026-03-31',
        ]));

    $response->assertOk()
        ->assertHeader('content-type', 'application/pdf');
});

test('authorized user can view outstanding checks html print report', function () {
    $user = User::factory()->create();
    $user->assignRole(Permissions::SUPER_ADMIN_ROLE);

    $response = $this->actingAs($user)
        ->get(route('bank_reconciliation.outstanding-checks-print', [
            'date_from' => '2026-03-01',
            'date_to' => '2026-03-31',
        ]));

    $response->assertOk()
        ->assertViewIs('pdfs.outstanding_checks');
});
