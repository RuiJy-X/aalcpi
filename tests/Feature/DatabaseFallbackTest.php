<?php

use App\Models\DatabaseConnection;
use App\Models\User;
use App\Services\DatabaseConfigurationService;
use App\Support\Permissions;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

test('ensure local database ready creates roles and seeds permissions when missing', function () {
    // Simulate a stale local SQLite that predates Spatie permission tables
    // by dropping them (migrations table stays so we can re-run).
    Schema::dropIfExists('role_has_permissions');
    Schema::dropIfExists('model_has_roles');
    Schema::dropIfExists('model_has_permissions');
    Schema::dropIfExists('roles');
    Schema::dropIfExists('permissions');

    // Clear migration record so migrate will recreate the tables
    DB::table('migrations')
        ->where('migration', 'like', '%create_permission_tables%')
        ->delete();

    expect(Schema::hasTable('roles'))->toBeFalse();

    DatabaseConfigurationService::ensureLocalDatabaseReady(forceMigrate: true);

    expect(Schema::hasTable('roles'))->toBeTrue();
    expect(DB::table('roles')->count())->toBeGreaterThan(0);
    expect(DB::table('permissions')->count())->toBeGreaterThan(0);
});

test('use local database switches default connection off remote driver', function () {
    Config::set('database.default', 'pgsql');

    DatabaseConfigurationService::useLocalDatabase();

    expect(config('database.default'))->toBe(DatabaseConfigurationService::localConnectionName());
    expect(Schema::hasTable('roles'))->toBeTrue();
});

test('authenticated user can load roles after local database is prepared', function () {
    $user = User::factory()->create();
    $user->assignRole(Permissions::SUPER_ADMIN_ROLE);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk();
});

test('deactivating remote connection falls back without server error', function () {
    $admin = User::factory()->create();
    $admin->assignRole(Permissions::SUPER_ADMIN_ROLE);

    // Inactive remote record — activate flag is set only for the controller path
    // so boot-time health checks do not hang on a real TCP timeout.
    $connection = DatabaseConnection::create([
        'connection_name' => 'Test Postgres',
        'driver' => 'pgsql',
        'host' => '127.0.0.1',
        'port' => 5432,
        'database' => 'missing_db',
        'username' => 'postgres',
        'password' => 'secret',
        'is_active' => true,
    ]);

    // Pretend the app was on the remote driver for this request lifecycle
    Config::set('database.default', 'pgsql');

    // Call the service path used by the controller (avoids re-bootstrap health check)
    $connection->makeInactive();
    DatabaseConfigurationService::useLocalDatabase();

    $connection->refresh();
    expect($connection->is_active)->toBeFalse();
    expect(config('database.default'))->toBe(DatabaseConfigurationService::localConnectionName());
    expect(Schema::hasTable('roles'))->toBeTrue();

    // Authenticated request must not 500 on missing roles after fallback
    $this->actingAs($admin)
        ->get(route('dashboard'))
        ->assertOk();
});
