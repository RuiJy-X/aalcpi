<?php

namespace App\Services;

use App\Models\DatabaseConnection;
use Illuminate\Support\Facades\Config;
use PDO;

class DatabaseConfigurationService
{
    public static function loadActiveConnection(): void
    {
        try {
            // Safe: DatabaseConnection always hits 'connection_registry' (sqlite),
            // never the dynamically-set default.
            $activeConnection = DatabaseConnection::getActiveConnection();

            if ($activeConnection) {
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

                $currentConnections = config('database.connections');
                $currentConnections[$activeConnection->driver] = array_merge(
                    $currentConnections[$activeConnection->driver] ?? [],
                    $connectionConfig
                );

                Config::set('database.connections', $currentConnections);
                Config::set('database.default', $activeConnection->driver);
            }
        } catch (\Exception $e) {
            if (str_contains($e->getMessage(), 'database_connections')) {
                return;
            }
            throw $e;
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