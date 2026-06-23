<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DatabaseConnection extends Model
{
    protected $table = 'database_connections';
    protected $connection = 'sqlite';

    protected $fillable = [
        'connection_name',
        'driver',
        'host',
        'port',
        'database',
        'username',
        'password',
        'charset',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'port' => 'integer',
    ];

    protected $hidden = [
        'password',
    ];

    /**
     * Get the active connection
     */
    public static function getActiveConnection()
    {
        return self::where('is_active', true)->first();
    }

    /**
     * Set this connection as active and deactivate others
     */
    public function makeActive()
    {
        // Deactivate all other connections
        self::where('id', '!=', $this->id)->update(['is_active' => false]);
        
        // Activate this one
        $this->update(['is_active' => true]);
        
        return $this;
    }
    /**
     * Deactivate this connection (falls back to default/sqlite on next boot)
     */
    public function makeInactive()
    {
        $this->update(['is_active' => false]);

        return $this;
    }

    /**
     * Test the database connection
     */
    public function testConnection(): array
    {
        try {
            $config = [
                'driver' => $this->driver,
                'host' => $this->host,
                'port' => $this->port,
                'database' => $this->database,
                'username' => $this->username,
                'password' => $this->password,
                'charset' => $this->charset ?? 'utf8',
            ];

            // Temporary database connection
            \DB::reconnect();
            $tempConnection = \DB::connection(
                $this->driver === 'pgsql' ? 'pgsql_test' : 'mysql_test'
            );

            // Add temporary config to connections
            $connections = config('database.connections');
            $connections['pgsql_test'] = array_merge($connections['pgsql'] ?? [], [
                'host' => $this->host,
                'port' => $this->port,
                'database' => $this->database,
                'username' => $this->username,
                'password' => $this->password,
            ]);

            config(['database.connections.pgsql_test' => $connections['pgsql_test']]);

            // Test the connection
            \DB::connection('pgsql_test')->getPdo();

            return [
                'success' => true,
                'message' => 'Database connection successful!',
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Connection failed: ' . $e->getMessage(),
            ];
        }
    }
}
