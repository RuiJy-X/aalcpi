<?php

namespace Tests\Feature;

use App\Models\Advancement;
use App\Models\Attendance;
use App\Models\Employee;
use App\Models\ImportJob;
use App\Models\Payroll;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ApplicationSmokeAndRegressionTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;
    protected Employee $testEmployee;

    protected function setUp(): void
    {
        parent::setUp();

        // Create Super Admin User with all permissions
        $this->adminUser = User::factory()->create([
            'email' => 'admin@aalcpi.test',
            'name' => 'System Admin',
        ]);

        $role = Role::firstOrCreate(['name' => 'super-admin']);
        $permissions = [
            'users.view', 'users.create', 'users.edit', 'users.delete',
            'roles.view', 'roles.create', 'roles.edit', 'roles.delete',
            'employees.view', 'employees.create', 'employees.edit', 'employees.delete',
            'attendance.view', 'attendance.create', 'attendance.edit', 'attendance.delete',
            'payroll.view', 'payroll.create', 'payroll.edit', 'payroll.delete',
            'advancements.view', 'advancements.create', 'advancements.edit', 'advancements.delete',
            'planters.view', 'planters.create', 'planters.edit', 'planters.delete',
            'productions.view', 'productions.create', 'productions.edit', 'productions.delete',
            'weekly.view', 'weekly.create', 'weekly.edit', 'weekly.delete',
            'bank_reconciliation.view', 'bank_reconciliation.create', 'bank_reconciliation.edit', 'bank_reconciliation.delete',
        ];

        foreach ($permissions as $perm) {
            Permission::firstOrCreate(['name' => $perm]);
        }
        $role->syncPermissions(Permission::all());
        $this->adminUser->assignRole($role);

        // Seed basic domain models for route testing
        $this->testEmployee = Employee::factory()->create([
            'name' => 'Juan Dela Cruz',
            'daily_rate' => 750.00,
        ]);
    }

    public function test_dashboard_route_renders_successfully(): void
    {
        $response = $this->actingAs($this->adminUser)->get('/dashboard');
        $response->assertStatus(200);
    }

    public function test_employees_index_and_show_routes_render_successfully(): void
    {
        $indexResponse = $this->actingAs($this->adminUser)->get('/Employees');
        $indexResponse->assertStatus(200);

        $showResponse = $this->actingAs($this->adminUser)->get("/Employees/{$this->testEmployee->id}");
        $showResponse->assertStatus(200);
        $showResponse->assertInertia(fn ($page) => $page
            ->component('Employees/Show')
            ->has('payrolls')
        );
    }

    public function test_employee_crud_and_validation_with_exact_17_fields(): void
    {
        $payload = [
            'employee_code'           => 'EMP-999',
            'name'                    => 'Test Employee 17 Fields',
            'position'                => 'Supervisor',
            'daily_rate'              => 800.00,
            'base_salary'             => 19200.00,
            'hourly_rate'             => 100.00,
            'address'                 => '123 Main St',
            'contact_number'          => '09123456789',
            'tin'                     => '123-456-789',
            'sss_no'                  => '12-3456789-0',
            'pagibig_no'              => '1234-5678-9012',
            'philhealth_no'           => '12-345678901-2',
            'sss_contribution'        => 350.00,
            'pagibig_contribution'    => 200.00,
            'philhealth_contribution' => 250.00,
            'emergency_loan'          => 150.00,
            'withholding_tax'         => 100.00,
        ];

        // Store
        $storeResponse = $this->actingAs($this->adminUser)->post('/Employees', $payload);
        $storeResponse->assertStatus(302);

        $emp = Employee::where('employee_code', 'EMP-999')->first();
        $this->assertNotNull($emp);
        $this->assertEquals('Test Employee 17 Fields', $emp->name);
        $this->assertEquals(350.00, (float) $emp->sss_contribution);
        $this->assertEquals(250.00, (float) $emp->philhealth_contribution);

        // Update
        $payload['name'] = 'Updated Employee 17 Fields';
        $payload['sss_contribution'] = 400.00;
        $updateResponse = $this->actingAs($this->adminUser)->put("/Employees/{$emp->id}", $payload);
        $updateResponse->assertStatus(302);
        $this->assertEquals('Updated Employee 17 Fields', $emp->fresh()->name);
        $this->assertEquals(400.00, (float) $emp->fresh()->sss_contribution);
    }

    public function test_payroll_routes_render_successfully(): void
    {
        $payroll = Payroll::create([
            'employee_id' => $this->testEmployee->id,
            'period_start' => '2026-08-01',
            'period_end' => '2026-08-15',
            'days_worked' => 10,
            'basic_pay' => 7500.00,
            'gross_pay' => 7500.00,
            'deductions' => 500.00,
            'net_pay' => 7000.00,
            'status' => 'draft',
        ]);

        $indexResponse = $this->actingAs($this->adminUser)->get('/Payroll');
        $indexResponse->assertStatus(200);

        $createResponse = $this->actingAs($this->adminUser)->get('/Payroll/create');
        $createResponse->assertStatus(200);

        $showResponse = $this->actingAs($this->adminUser)->get("/Payroll/{$payroll->id}");
        $showResponse->assertStatus(200);
    }

    public function test_payroll_status_transition_and_immutability(): void
    {
        $payroll = Payroll::create([
            'employee_id' => $this->testEmployee->id,
            'period_start' => '2026-08-01',
            'period_end' => '2026-08-15',
            'days_worked' => 10,
            'basic_pay' => 7500.00,
            'gross_pay' => 7500.00,
            'deductions' => 500.00,
            'net_pay' => 7000.00,
            'status' => 'draft',
        ]);

        // Transition draft -> pending
        $pendingResponse = $this->actingAs($this->adminUser)->patch("/Payroll/{$payroll->id}/status", [
            'status' => 'pending',
        ]);
        $pendingResponse->assertStatus(302);
        $this->assertEquals('pending', $payroll->fresh()->status);

        // Transition pending -> paid
        $paidResponse = $this->actingAs($this->adminUser)->patch("/Payroll/{$payroll->id}/status", [
            'status' => 'paid',
        ]);
        $paidResponse->assertStatus(302);
        $this->assertEquals('paid', $payroll->fresh()->status);

        // Attempt invalid un-finalization (paid -> draft) must throw validation error
        $revertResponse = $this->actingAs($this->adminUser)->patch("/Payroll/{$payroll->id}/status", [
            'status' => 'draft',
        ]);
        $revertResponse->assertSessionHasErrors(['status']);
        $this->assertEquals('paid', $payroll->fresh()->status);
    }

    public function test_advancements_routes_and_grant_workflow(): void
    {
        $pageResponse = $this->actingAs($this->adminUser)->get('/Advancements/page');
        $pageResponse->assertStatus(200);

        $grantResponse = $this->actingAs($this->adminUser)->post('/Advancements', [
            'employee_id' => $this->testEmployee->id,
            'amount' => 1500.00,
            'advancement_date' => '2026-08-05',
            'notes' => 'Test Emergency Advance',
        ]);
        $grantResponse->assertStatus(302);

        $advancement = Advancement::where('employee_id', $this->testEmployee->id)->first();
        $this->assertNotNull($advancement);
        $this->assertEquals(1500.00, (float) $advancement->amount);
    }

    public function test_bank_reconciliation_workspace_renders_successfully(): void
    {
        $workspaceResponse = $this->actingAs($this->adminUser)->get('/BankReconciliation/reconciliation-workspace');
        $workspaceResponse->assertStatus(200);
    }

    public function test_planters_index_renders_successfully(): void
    {
        $response = $this->actingAs($this->adminUser)->get('/Planters');
        $response->assertStatus(200);
    }

    public function test_productions_index_renders_successfully(): void
    {
        $response = $this->actingAs($this->adminUser)->get('/Productions');
        $response->assertStatus(200);
    }

    public function test_weekly_index_renders_successfully(): void
    {
        $response = $this->actingAs($this->adminUser)->get('/Weekly');
        $response->assertStatus(200);
    }

    public function test_attendance_index_renders_successfully(): void
    {
        $response = $this->actingAs($this->adminUser)->get('/Attendance');
        $response->assertStatus(200);
    }

    public function test_import_history_index_renders_successfully(): void
    {
        $response = $this->actingAs($this->adminUser)->get('/Imports/history');
        $response->assertStatus(200);
    }

    public function test_users_and_roles_management_routes_render_successfully(): void
    {
        $usersResponse = $this->actingAs($this->adminUser)->get('/Users');
        $usersResponse->assertStatus(200);

        $rolesResponse = $this->actingAs($this->adminUser)->get('/Roles');
        $rolesResponse->assertStatus(200);
    }

    public function test_settings_routes_render_successfully(): void
    {
        $settingsResponse = $this->actingAs($this->adminUser)->get('/settings/database-connection');
        $settingsResponse->assertStatus(200);
    }

    public function test_system_health_check_endpoint_reports_all_systems_operational(): void
    {
        $healthResponse = $this->actingAs($this->adminUser)->get('/system/health-check');
        $healthResponse->assertStatus(200);
        $healthResponse->assertJson([
            'system_status' => 'ALL_SYSTEMS_OPERATIONAL',
        ]);
    }
}
