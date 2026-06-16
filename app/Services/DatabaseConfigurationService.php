<?php

namespace App\Services;

use App\Models\DatabaseConnection;
use Illuminate\Support\Facades\Config;
use PDO;

class DatabaseConfigurationService
{
    /**
     * Load the active database connection configuration
     */
    public static function loadActiveConnection(): void
    {
        try {
            $activeConnection = DatabaseConnection::getActiveConnection();

            if ($activeConnection) {
                // Update the configuration for the active driver
                $connectionConfig = [
                    'driver' => $activeConnection->driver,
                    'host' => $activeConnection->host,
                    'port' => $activeConnection->port,
                    'database' => $activeConnection->database,
                    'username' => $activeConnection->username,
                    'password' => $activeConnection->password,
                    'charset' => $activeConnection->charset ?? 'utf8',
                ];

                // Add driver-specific configurations
                if ($activeConnection->driver === 'pgsql') {
                    $connectionConfig['sslmode'] = 'prefer';
                    $connectionConfig['prefix'] = '';
                    $connectionConfig['prefix_indexes'] = true;
                    $connectionConfig['search_path'] = 'public';
                }

                // Update the configuration
                $currentConnections = config('database.connections');
                $currentConnections[$activeConnection->driver] = array_merge(
                    $currentConnections[$activeConnection->driver] ?? [],
                    $connectionConfig
                );

                Config::set('database.connections', $currentConnections);
                Config::set('database.default', $activeConnection->driver);
            }
        } catch (\Exception $e) {
            // If the database_connections table doesn't exist yet, continue with default config
            // This happens on first run before migrations are executed
            if (str_contains($e->getMessage(), 'database_connections')) {
                return;
            }

            throw $e;
        }
    }

    /**
     * Test a database connection without establishing it permanently
     */
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
