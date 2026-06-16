<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\DatabaseConnectionStoreRequest;
use App\Models\DatabaseConnection;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DatabaseConnectionController extends Controller
{
    /**
     * Show the database settings page.
     */
    public function index(Request $request): Response
    {
        $connections = DatabaseConnection::all()->map(function ($conn) {
            return [
                'id' => $conn->id,
                'connection_name' => $conn->connection_name,
                'driver' => $conn->driver,
                'host' => $conn->host,
                'port' => $conn->port,
                'database' => $conn->database,
                'username' => $conn->username,
                'is_active' => $conn->is_active,
                'created_at' => $conn->created_at->toDateTimeString(),
            ];
        });

        return Inertia::render('settings/database', [
            'connections' => $connections,
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Store a new database connection.
     */
    public function store(DatabaseConnectionStoreRequest $request)
    {
        $connection = DatabaseConnection::create($request->validated());

        return response()->json([
            'id' => $connection->id,
            'message' => 'Database connection created successfully!',
        ]);
    }

    /**
     * Test a database connection.
     */
    public function test(Request $request)
    {
        $request->validate([
            'driver' => ['required', 'string', 'in:pgsql,mysql'],
            'host' => ['required', 'string'],
            'port' => ['required', 'integer'],
            'database' => ['required', 'string'],
            'username' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        try {
            // Create temporary PDO connection
            $dsn = match ($request->driver) {
                'pgsql' => "pgsql:host={$request->host};port={$request->port};dbname={$request->database}",
                'mysql' => "mysql:host={$request->host};port={$request->port};dbname={$request->database}",
            };

            new \PDO($dsn, $request->username, $request->password);

            return back()->with([
            'test_success' => true,
            'test_message' => 'Database connection successful!'
            ]);
        } catch (\Exception $e) {
            return back()->with([
            'test_success' => false,
            'test_message' => 'Connection failed: ' . $e->getMessage()
            ] );
        }
    }

    /**
     * Activate a database connection.
     */
    public function activate(DatabaseConnection $connection): RedirectResponse
    {
        $connection->makeActive();

        return redirect()->route('database.edit')
            ->with('status', 'Database connection activated successfully!');
    }

    /**
     * Delete a database connection.
     */
    public function destroy(DatabaseConnection $connection): RedirectResponse
    {
        if ($connection->is_active) {
            return back()->with('error', 'Cannot delete the active database connection');
        }

        $connection->delete();

        return redirect()->route('database.edit')
            ->with('status', 'Database connection deleted successfully!');
    }
}
