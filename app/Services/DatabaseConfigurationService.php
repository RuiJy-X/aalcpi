<?php

namespace App\Services;

use App\Models\DatabaseConnection;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Log;
use PDO;

class DatabaseConfigurationService
{
    public static function loadActiveConnection(): void
    {
        try {
            $activeConnection = DatabaseConnection::getActiveConnection();

            if (! $activeConnection) {
                return; // nothing active, stay on sqlite default
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
                Log::warning("Active database connection '{$activeConnection->connection_name}' failed health check at boot. Falling back to SQLite and deactivating it.");

                // Self-heal: deactivate so future requests don't even try.
                $activeConnection->makeInactive();

                return; // stay on sqlite default
            }

            $currentConnections = config('database.connections');
            $currentConnections[$activeConnection->driver] = array_merge(
                $currentConnections[$activeConnection->driver] ?? [],
                $connectionConfig
            );

            Config::set('database.connections', $currentConnections);
            Config::set('database.default', $activeConnection->driver);
        } catch (\Exception $e) {
            if (str_contains($e->getMessage(), 'database_connections')) {
                return;
            }

            Log::error('DatabaseConfigurationService::loadActiveConnection failed: ' . $e->getMessage());
            // Swallow it — never let a config-loading problem become a fatal boot error.
            return;
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