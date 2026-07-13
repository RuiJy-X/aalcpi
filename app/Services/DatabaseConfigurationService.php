<?php

namespace App\Services;

use App\Models\DatabaseConnection;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use PDO;
use Spatie\Permission\PermissionRegistrar;

class DatabaseConfigurationService
{
    /**
     * Ensure we only prepare the local database once per process.
     */
    protected static bool $localDatabaseReady = false;

    public static function loadActiveConnection(): void
    {
        try {
            // Registry lives on the dedicated sqlite connection; keep it migratable
            // so DatabaseConnection queries never blow up on a stale file.
            self::ensureRegistryDatabaseReady();

            $activeConnection = DatabaseConnection::getActiveConnection();

            if (! $activeConnection) {
                // No remote DB selected — keep the local driver healthy.
                self::ensureLocalDatabaseReady();

                return;
            }

            $connectionConfig = [
                'driver' => $activeConnection->driver,
                'host' => $activeConnection->host,
                'port' => $activeConnection->port,
                'database' => $activeConnection->database,
                'username' => $activeConnection->username,
                'password' => $activeConnection->password,
                'charset' => $activeConnection->charset ?? 'utf8',
            ];

            if ($activeConnection->driver === 'pgsql') {
                $connectionConfig['sslmode'] = 'prefer';
                $connectionConfig['prefix'] = '';
                $connectionConfig['prefix_indexes'] = true;
                $connectionConfig['search_path'] = 'public';
            }

            // Verify BEFORE switching the app's default connection.
            // This is the step that prevents lockout.
            $isReachable = self::testConnection(
                $activeConnection->driver,
                $activeConnection->host,
                $activeConnection->port,
                $activeConnection->database,
                $activeConnection->username,
                $activeConnection->password
            );

            if (! $isReachable) {
                Log::warning("Active database connection '{$activeConnection->connection_name}' failed health check at boot. Falling back to local SQLite and deactivating it.");

                // Self-heal: deactivate so future requests don't even try.
                $activeConnection->makeInactive();
                self::useLocalDatabase();

                return;
            }

            $currentConnections = config('database.connections');
            $currentConnections[$activeConnection->driver] = array_merge(
                $currentConnections[$activeConnection->driver] ?? [],
                $connectionConfig
            );

            Config::set('database.connections', $currentConnections);
            Config::set('database.default', $activeConnection->driver);
            self::forgetPermissionCache();
        } catch (\Exception $e) {
            if (str_contains($e->getMessage(), 'database_connections')) {
                // Registry table may not exist yet (fresh install) — prepare local DB.
                self::ensureLocalDatabaseReady(forceMigrate: true);

                return;
            }

            Log::error('DatabaseConfigurationService::loadActiveConnection failed: '.$e->getMessage());
            // Never let a config-loading problem become a fatal boot error.
            self::useLocalDatabase();
        }
    }

    /**
     * Switch the app back to the local SQLite (or NativePHP) database and
     * make sure its schema/seed data is ready for login & authorization.
     */
    public static function useLocalDatabase(): void
    {
        $local = self::localConnectionName();

        Config::set('database.default', $local);

        // Only purge remote drivers. Purging a sqlite :memory: connection
        // disconnects PDO and creates a brand-new empty database.
        foreach (['pgsql', 'mysql'] as $connection) {
            try {
                DB::purge($connection);
            } catch (\Throwable) {
                // Connection may not have been resolved yet.
            }
        }

        self::forgetPermissionCache();
        self::$localDatabaseReady = false;
        self::ensureLocalDatabaseReady($local, forceMigrate: true);
    }

    /**
     * Name of the local fallback connection.
     * NativePHP rewrites the default to "nativephp"; web apps use "sqlite".
     */
    public static function localConnectionName(): string
    {
        if (array_key_exists('nativephp', config('database.connections', []))) {
            return 'nativephp';
        }

        return 'sqlite';
    }

    /**
     * Run pending migrations and seed roles/permissions on the local DB
     * when the schema is incomplete (common after falling back from Postgres).
     *
     * @param  bool  $forceMigrate  When true, always run migrate (deactivate / native boot).
     */
    public static function ensureLocalDatabaseReady(?string $connection = null, bool $forceMigrate = false): void
    {
        if (self::$localDatabaseReady && ! $forceMigrate) {
            return;
        }

        $connection = $connection ?? self::localConnectionName();

        try {
            self::ensureSqliteFileExists($connection);

            $schemaIncomplete = ! self::connectionHasTable($connection, 'roles')
                || ! self::connectionHasTable($connection, 'users');

            // Always migrate when forced (deactivate / native boot) or when the
            // local DB is missing critical tables. Avoid running migrate on every
            // web request once the schema is healthy.
            if ($forceMigrate || $schemaIncomplete) {
                Artisan::call('migrate', [
                    '--database' => $connection,
                    '--force' => true,
                ]);
            }

            self::ensureRolesAndPermissionsSeeded($connection);

            self::$localDatabaseReady = true;
        } catch (\Throwable $e) {
            Log::error('DatabaseConfigurationService::ensureLocalDatabaseReady failed: '.$e->getMessage());
        }
    }

    /**
     * The DatabaseConnection model is hard-pinned to the "sqlite" connection so
     * the connection registry survives remote DB switches. On NativePHP that
     * file is separate from nativephp.sqlite, so it needs its own migrations.
     */
    public static function ensureRegistryDatabaseReady(): void
    {
        $registry = 'sqlite';

        if (! config("database.connections.{$registry}")) {
            return;
        }

        // When local app DB is also "sqlite", ensureLocalDatabaseReady covers it.
        if (self::localConnectionName() === $registry) {
            return;
        }

        try {
            if (self::connectionHasTable($registry, 'database_connections')) {
                return;
            }

            self::ensureSqliteFileExists($registry);

            Artisan::call('migrate', [
                '--database' => $registry,
                '--force' => true,
                '--path' => 'database/migrations/2024_06_16_000000_create_database_connections_table.php',
            ]);
        } catch (\Throwable $e) {
            Log::error('DatabaseConfigurationService::ensureRegistryDatabaseReady failed: '.$e->getMessage());
        }
    }

    protected static function connectionHasTable(string $connection, string $table): bool
    {
        try {
            return Schema::connection($connection)->hasTable($table);
        } catch (\Throwable) {
            return false;
        }
    }

    protected static function ensureSqliteFileExists(string $connection): void
    {
        $config = config("database.connections.{$connection}");

        if (($config['driver'] ?? null) !== 'sqlite') {
            return;
        }

        $path = $config['database'] ?? null;

        if (! is_string($path) || $path === '' || $path === ':memory:') {
            return;
        }

        if (! file_exists($path)) {
            $directory = dirname($path);

            if (! is_dir($directory)) {
                mkdir($directory, 0755, true);
            }

            touch($path);
        }
    }

    protected static function ensureRolesAndPermissionsSeeded(string $connection): void
    {
        if (! self::connectionHasTable($connection, 'roles')) {
            return;
        }

        try {
            $rolesExist = DB::connection($connection)->table('roles')->exists();
        } catch (\Throwable) {
            return;
        }

        if ($rolesExist) {
            return;
        }

        $previous = config('database.default');

        try {
            Config::set('database.default', $connection);
            self::forgetPermissionCache();

            Artisan::call('db:seed', [
                '--class' => 'Database\\Seeders\\RolePermissionSeeder',
                '--force' => true,
            ]);
        } finally {
            Config::set('database.default', $previous);
            self::forgetPermissionCache();
        }
    }

    protected static function forgetPermissionCache(): void
    {
        try {
            app(PermissionRegistrar::class)->forgetCachedPermissions();
        } catch (\Throwable) {
            // Permission package may not be booted yet.
        }
    }

    public static function testConnection(
        string $driver,
        string $host,
        int $port,
        string $database,
        string $username,
        string $password
    ): bool {
        try {
            $dsn = match ($driver) {
                'pgsql' => "pgsql:host={$host};port={$port};dbname={$database}",
                'mysql' => "mysql:host={$host};port={$port};dbname={$database}",
                default => throw new \InvalidArgumentException("Unsupported driver: {$driver}")
            };

            new PDO($dsn, $username, $password, [
                PDO::ATTR_TIMEOUT => 5,
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            ]);

            return true;
        } catch (\Exception $e) {
            return false;
        }
    }
}
