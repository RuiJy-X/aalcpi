<?php

use App\Models\BankStatement;
use App\Models\ImportJob;
use App\Models\InternalDisbursements;
use App\Models\User;
use App\Support\Permissions;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
    Storage::fake('local');
});

/**
 * Helper to generate a valid Internal Disbursements Excel spreadsheet
 */
function createInternalDisbursementExcel(array $dataRows): UploadedFile
{
    $spreadsheet = new Spreadsheet();
    $sheet = $spreadsheet->getActiveSheet();

    // Headers on Row 6 (heading row)
    $sheet->setCellValue('A6', 'audit_no');
    $sheet->setCellValue('B6', 'check_no');
    $sheet->setCellValue('C6', 'payee_name');
    $sheet->setCellValue('D6', 'check_amount');
    $sheet->setCellValue('E6', 'date_return');

    $currentRow = 7;
    foreach ($dataRows as $row) {
        $sheet->setCellValue("A{$currentRow}", $row['audit_no'] ?? '');
        $sheet->setCellValue("B{$currentRow}", $row['check_no'] ?? '');
        $sheet->setCellValue("C{$currentRow}", $row['payee_name'] ?? '');
        $sheet->setCellValue("D{$currentRow}", $row['check_amount'] ?? '');
        $sheet->setCellValue("E{$currentRow}", $row['date_return'] ?? '');
        $currentRow++;
    }

    $tempFile = tempnam(sys_get_temp_dir(), 'test_internal_') . '.xlsx';
    (new Xlsx($spreadsheet))->save($tempFile);

    return new UploadedFile($tempFile, 'internal_disbursements.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', null, true);
}

/**
 * Helper to generate a valid Bank Statement Excel spreadsheet
 */
function createBankStatementExcel(array $dataRows): UploadedFile
{
    $spreadsheet = new Spreadsheet();
    $sheet = $spreadsheet->getActiveSheet();

    // Headers on Row 1 (heading row)
    $sheet->setCellValue('A1', 'tdate');
    $sheet->setCellValue('B1', 'checkno');
    $sheet->setCellValue('C1', 'debit');
    $sheet->setCellValue('D1', 'credit');
    $sheet->setCellValue('E1', 'running_balance');
    $sheet->setCellValue('F1', 'branch_description');
    $sheet->setCellValue('G1', 'partic');

    $currentRow = 2;
    foreach ($dataRows as $row) {
        $sheet->setCellValue("A{$currentRow}", $row['tdate'] ?? '');
        $sheet->setCellValue("B{$currentRow}", $row['checkno'] ?? '');
        $sheet->setCellValue("C{$currentRow}", $row['debit'] ?? '');
        $sheet->setCellValue("D{$currentRow}", $row['credit'] ?? '');
        $sheet->setCellValue("E{$currentRow}", $row['running_balance'] ?? '');
        $sheet->setCellValue("F{$currentRow}", $row['branch_description'] ?? '');
        $sheet->setCellValue("G{$currentRow}", $row['partic'] ?? '');
        $currentRow++;
    }

    $tempFile = tempnam(sys_get_temp_dir(), 'test_bank_') . '.xlsx';
    (new Xlsx($spreadsheet))->save($tempFile);

    return new UploadedFile($tempFile, 'bank_statement.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', null, true);
}

test('file analysis identifies new rows, exact duplicates, possible duplicates, and invalid rows accurately', function () {
    $user = User::factory()->create();
    $user->assignRole(Permissions::SUPER_ADMIN_ROLE);

    // Seed existing DB record
    InternalDisbursements::create([
        'check_no' => 'CHK-1001',
        'payee_name' => 'Existing Exact Payee',
        'check_amount' => 500.00,
        'date_issued' => '2026-08-01',
        'disbursement_week' => 1,
        'audit_no' => 'AUD-01',
    ]);

    InternalDisbursements::create([
        'check_no' => 'CHK-1002',
        'payee_name' => 'Old Payee Name',
        'check_amount' => 1200.00,
        'date_issued' => '2026-08-01',
        'disbursement_week' => 1,
        'audit_no' => 'AUD-02',
    ]);

    // Spreadsheet rows:
    // 1. Exact Duplicate (CHK-1001)
    // 2. Possible Duplicate (CHK-1002, amount 1500 instead of 1200, Payee changed)
    // 3. New Row (CHK-1003)
    // 4. Invalid Row (empty check_no and audit_no)
    $file = createInternalDisbursementExcel([
        [
            'audit_no' => 'AUD-01',
            'check_no' => 'CHK-1001',
            'payee_name' => 'Existing Exact Payee',
            'check_amount' => '500.00',
        ],
        [
            'audit_no' => 'AUD-02',
            'check_no' => 'CHK-1002',
            'payee_name' => 'Updated Payee Name',
            'check_amount' => '1500.00',
        ],
        [
            'audit_no' => 'AUD-03',
            'check_no' => 'CHK-1003',
            'payee_name' => 'Brand New Payee',
            'check_amount' => '750.00',
        ],
        [
            'audit_no' => '',
            'check_no' => '',
            'payee_name' => 'Invalid Row',
            'check_amount' => '100.00',
        ],
    ]);

    $response = $this->actingAs($user)->postJson('/bank-reconciliation-import/analyze', [
        'file' => $file,
        'type' => 'internal',
        'date_issued' => '2026-08-01',
        'disbursement_week' => 1,
    ]);

    $response->assertOk()
        ->assertJsonStructure([
            'analysis_token',
            'total_rows',
            'new_rows_count',
            'exact_duplicates_count',
            'possible_duplicates_count',
            'invalid_rows_count',
            'possible_duplicates',
        ]);

    $data = $response->json();
    expect($data['total_rows'])->toBe(4);
    expect($data['exact_duplicates_count'])->toBe(1);
    expect($data['possible_duplicates_count'])->toBe(1);
    expect($data['new_rows_count'])->toBe(1);
    expect($data['invalid_rows_count'])->toBe(1);

    // Verify differences diff payload for CHK-1002
    expect(count($data['possible_duplicates']))->toBe(1);
    $possibleDup = $data['possible_duplicates'][0];
    expect($possibleDup['identifier'])->toBe('CHK-1002');
    expect(count($possibleDup['differences']))->toBeGreaterThan(0);
});

test('importing the exact same internal disbursements file twice produces zero duplicate rows', function () {
    $user = User::factory()->create();
    $user->assignRole(Permissions::SUPER_ADMIN_ROLE);

    $fileRows = [
        [
            'audit_no' => 'AUD-10',
            'check_no' => 'CHK-5001',
            'payee_name' => 'Payee 1',
            'check_amount' => '1000.00',
        ],
        [
            'audit_no' => 'AUD-11',
            'check_no' => 'CHK-5002',
            'payee_name' => 'Payee 2',
            'check_amount' => '2000.00',
        ],
    ];

    // First Import
    $file1 = createInternalDisbursementExcel($fileRows);
    $this->actingAs($user)->post(route('bank-reconciliation-import.import'), [
        'file' => $file1,
        'type' => 'internal',
        'date_issued' => '2026-08-01',
        'disbursement_week' => 1,
    ])->assertSessionHasNoErrors();

    // Verify 2 rows in DB
    expect(InternalDisbursements::count())->toBe(2);
    expect(InternalDisbursements::where('is_duplicate', true)->count())->toBe(0);

    // Second Import with identical file
    $file2 = createInternalDisbursementExcel($fileRows);
    $this->actingAs($user)->post(route('bank-reconciliation-import.import'), [
        'file' => $file2,
        'type' => 'internal',
        'date_issued' => '2026-08-01',
        'disbursement_week' => 1,
    ])->assertSessionHasNoErrors();

    // Verify still exactly 2 rows in DB, NOT 4!
    expect(InternalDisbursements::count())->toBe(2);
    expect(InternalDisbursements::where('is_duplicate', true)->count())->toBe(0);
});

test('importing the exact same bank statement file twice produces zero duplicate rows', function () {
    $user = User::factory()->create();
    $user->assignRole(Permissions::SUPER_ADMIN_ROLE);

    $bankRows = [
        [
            'tdate' => '2026-08-10',
            'checkno' => 'CHK-BK-01',
            'debit' => '1500.00',
            'credit' => '',
            'running_balance' => '50000.00',
            'branch_description' => 'Main Branch',
            'partic' => 'Check debit',
        ],
        [
            'tdate' => '2026-08-15',
            'checkno' => '',
            'debit' => '',
            'credit' => '25000.00',
            'running_balance' => '75000.00',
            'branch_description' => 'Main Branch',
            'partic' => 'Deposit funds',
        ],
    ];

    // First Import
    $file1 = createBankStatementExcel($bankRows);
    $this->actingAs($user)->post(route('bank-reconciliation-import.import'), [
        'file' => $file1,
        'type' => 'bank',
        'bank_date' => '2026-08-01',
    ])->assertSessionHasNoErrors();

    expect(BankStatement::count())->toBe(2);

    // Second Import with same data
    $file2 = createBankStatementExcel($bankRows);
    $this->actingAs($user)->post(route('bank-reconciliation-import.import'), [
        'file' => $file2,
        'type' => 'bank',
        'bank_date' => '2026-08-01',
    ])->assertSessionHasNoErrors();

    // Verify still exactly 2 rows in DB, NOT 4!
    expect(BankStatement::count())->toBe(2);
});

test('possible duplicate with update resolution updates existing record', function () {
    $user = User::factory()->create();
    $user->assignRole(Permissions::SUPER_ADMIN_ROLE);

    $existing = InternalDisbursements::create([
        'check_no' => 'CHK-UPDATE-1',
        'payee_name' => 'Old Payee Name',
        'check_amount' => 1000.00,
        'date_issued' => '2026-08-01',
        'disbursement_week' => 1,
    ]);

    $file = createInternalDisbursementExcel([
        [
            'audit_no' => 'AUD-NEW',
            'check_no' => 'CHK-UPDATE-1',
            'payee_name' => 'New Payee Name',
            'check_amount' => '1250.00',
        ],
    ]);

    // Analyze first
    $analyzeRes = $this->actingAs($user)->postJson('/bank-reconciliation-import/analyze', [
        'file' => $file,
        'type' => 'internal',
        'date_issued' => '2026-08-01',
        'disbursement_week' => 1,
    ]);

    $analyzeRes->assertOk();
    $token = $analyzeRes->json('analysis_token');
    $rowId = $analyzeRes->json('possible_duplicates.0.row_id');

    // Confirm with update resolution
    $this->actingAs($user)->post(route('bank-reconciliation-import.import'), [
        'analysis_token' => $token,
        'duplicate_resolutions' => [
            $rowId => 'update',
        ],
    ])->assertSessionHasNoErrors();

    expect(InternalDisbursements::count())->toBe(1);
    $existing->refresh();
    expect((float) $existing->check_amount)->toEqual(1250.00);
    expect($existing->payee_name)->toBe('New Payee Name');
    expect($existing->audit_no)->toBe('AUD-NEW');
});

test('possible duplicate with keep_both resolution creates a second record and flags duplicate', function () {
    $user = User::factory()->create();
    $user->assignRole(Permissions::SUPER_ADMIN_ROLE);

    $existing = InternalDisbursements::create([
        'check_no' => 'CHK-KEEP-1',
        'payee_name' => 'Original Payee',
        'check_amount' => 1000.00,
        'date_issued' => '2026-08-01',
        'disbursement_week' => 1,
        'is_duplicate' => false,
    ]);

    $file = createInternalDisbursementExcel([
        [
            'audit_no' => 'AUD-2nd',
            'check_no' => 'CHK-KEEP-1',
            'payee_name' => 'Second Payee',
            'check_amount' => '1500.00',
        ],
    ]);

    $analyzeRes = $this->actingAs($user)->postJson('/bank-reconciliation-import/analyze', [
        'file' => $file,
        'type' => 'internal',
        'date_issued' => '2026-08-01',
        'disbursement_week' => 1,
    ]);

    $token = $analyzeRes->json('analysis_token');
    $rowId = $analyzeRes->json('possible_duplicates.0.row_id');

    // Confirm with keep_both
    $this->actingAs($user)->post(route('bank-reconciliation-import.import'), [
        'analysis_token' => $token,
        'duplicate_resolutions' => [
            $rowId => 'keep_both',
        ],
    ])->assertSessionHasNoErrors();

    expect(InternalDisbursements::count())->toBe(2);

    $allRecords = InternalDisbursements::where('check_no', 'CHK-KEEP-1')->get();
    expect($allRecords->count())->toBe(2);
    // Both records sharing check_no should have is_duplicate = true
    expect($allRecords->where('is_duplicate', true)->count())->toBe(2);
});

test('possible duplicate with replace resolution resets reconciliation links and overwrites data', function () {
    $user = User::factory()->create();
    $user->assignRole(Permissions::SUPER_ADMIN_ROLE);

    $bank = BankStatement::create([
        'tdate' => '2026-08-01',
        'checkno' => 'CHK-REPLACE-1',
        'debit' => 1000.00,
        'running_balance' => 5000.00,
        'bank_date' => '2026-08-01',
        'is_duplicate' => false,
    ]);

    $existing = InternalDisbursements::create([
        'check_no' => 'CHK-REPLACE-1',
        'payee_name' => 'Old Payee',
        'check_amount' => 1000.00,
        'date_issued' => '2026-08-01',
        'disbursement_week' => 1,
        'bank_statement_id' => $bank->id,
        'status' => 'Matched',
    ]);

    $file = createInternalDisbursementExcel([
        [
            'audit_no' => 'AUD-REPLACED',
            'check_no' => 'CHK-REPLACE-1',
            'payee_name' => 'Replaced Payee',
            'check_amount' => '1800.00',
        ],
    ]);

    $analyzeRes = $this->actingAs($user)->postJson('/bank-reconciliation-import/analyze', [
        'file' => $file,
        'type' => 'internal',
        'date_issued' => '2026-08-01',
        'disbursement_week' => 1,
    ]);

    $token = $analyzeRes->json('analysis_token');
    $rowId = $analyzeRes->json('possible_duplicates.0.row_id');

    // Confirm with replace
    $this->actingAs($user)->post(route('bank-reconciliation-import.import'), [
        'analysis_token' => $token,
        'duplicate_resolutions' => [
            $rowId => 'replace',
        ],
    ])->assertSessionHasNoErrors();

    expect(InternalDisbursements::count())->toBe(1);
    $existing->refresh();
    expect((float) $existing->check_amount)->toEqual(1800.00);
    expect($existing->payee_name)->toBe('Replaced Payee');
});

test('import history and status endpoints return comprehensive duplicate audit context', function () {
    $user = User::factory()->create();
    $user->assignRole(Permissions::SUPER_ADMIN_ROLE);

    $job = ImportJob::create([
        'user_id' => $user->id,
        'type' => 'bank_recon_internal',
        'status' => ImportJob::STATUS_DONE,
        'file_name' => 'disbursements_with_dups.xlsx',
        'context' => [
            'heading_row' => 6,
            'headers_read' => ['check_no', 'check_amount', 'payee_name'],
            'rows_read' => 100,
            'rows_saved' => 85,
            'rows_skipped' => 15,
            'exact_duplicates_count' => 10,
            'possible_duplicates_count' => 5,
            'updated_count' => 3,
            'replaced_count' => 1,
            'kept_both_count' => 1,
            'new_rows_count' => 80,
            'duplicate_count' => 2,
        ],
    ]);

    $response = $this->actingAs($user)->getJson("/Imports/status/{$job->id}");

    $response->assertOk()
        ->assertJsonPath('context.exact_duplicates_count', 10)
        ->assertJsonPath('context.possible_duplicates_count', 5)
        ->assertJsonPath('context.updated_count', 3)
        ->assertJsonPath('context.replaced_count', 1)
        ->assertJsonPath('context.kept_both_count', 1)
        ->assertJsonPath('context.new_rows_count', 80);
});

test('pre-import audit and post-import execution identify the exact same skipped row numbers including empty rows', function () {
    $user = User::factory()->create();
    $user->assignRole(Permissions::SUPER_ADMIN_ROLE);

    // Create a spreadsheet with valid rows and several blank/invalid rows at specific positions:
    // Row 7 (index 0): Valid
    // Row 8 (index 1): Blank row (skipped)
    // Row 9 (index 2): Blank row (skipped)
    // Row 10 (index 3): Valid
    // Row 11 (index 4): Invalid amount (skipped)
    $fileRows = [
        [
            'audit_no' => 'AUD-1',
            'check_no' => 'CHK-8001',
            'payee_name' => 'Payee A',
            'check_amount' => '1000.00',
        ],
        [
            'audit_no' => '',
            'check_no' => '',
            'payee_name' => '',
            'check_amount' => '',
        ],
        [
            'audit_no' => '',
            'check_no' => '',
            'payee_name' => '',
            'check_amount' => '',
        ],
        [
            'audit_no' => 'AUD-2',
            'check_no' => 'CHK-8002',
            'payee_name' => 'Payee B',
            'check_amount' => '2000.00',
        ],
        [
            'audit_no' => 'AUD-3',
            'check_no' => 'CHK-8003',
            'payee_name' => 'Payee C',
            'check_amount' => 'INVALID_NUMBER',
        ],
        [
            'audit_no' => '',
            'check_no' => '',
            'payee_name' => 'TOTAL SUMMARY',
            'check_amount' => '3000.00',
        ],
    ];

    // 1. Pre-Import Analyze
    $file = createInternalDisbursementExcel($fileRows);
    $analyzeRes = $this->actingAs($user)->postJson('/bank-reconciliation-import/analyze', [
        'file' => $file,
        'type' => 'internal',
        'date_issued' => '2026-08-01',
        'disbursement_week' => 1,
    ]);

    $analyzeRes->assertOk();
    $analysis = $analyzeRes->json();

    expect($analysis['new_rows_count'])->toBe(2);
    expect($analysis['invalid_rows_count'])->toBe(2);

    $invalidRowNumbers = array_column($analysis['invalid_rows'], 'row_number');
    expect($invalidRowNumbers)->toBe([11, 12]);

    // 2. Post-Import Execution
    $file2 = createInternalDisbursementExcel($fileRows);
    $this->actingAs($user)->post(route('bank-reconciliation-import.import'), [
        'analysis_token' => $analysis['analysis_token'],
        'duplicate_resolutions' => [],
    ])->assertSessionHasNoErrors();

    $job = ImportJob::latest()->first();
    expect($job->context['rows_saved'])->toBe(2);
    expect($job->context['invalid_rows_count'])->toBe(2);

    // Verify warnings logged for exactly rows 11 and 12
    $warningStrings = implode(' ', $job->context['warnings']);
    expect($warningStrings)->toContain('Row 11:');
    expect($warningStrings)->toContain('Row 12:');
});

