<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\Payroll;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

class HealthCheckController extends Controller
{
    /**
     * Run a comprehensive health check audit across all application modules and routes.
     */
    public function check(Request $request): JsonResponse
    {
        $targetRoutes = [
            ['name' => 'dashboard', 'uri' => '/dashboard'],
            ['name' => 'employees.index', 'uri' => '/Employees'],
            ['name' => 'payroll.index', 'uri' => '/Payroll'],
            ['name' => 'payroll.create', 'uri' => '/Payroll/create'],
            ['name' => 'advancements.page', 'uri' => '/Advancements/page'],
            ['name' => 'planters.index', 'uri' => '/Planters'],
            ['name' => 'productions.index', 'uri' => '/Productions'],
            ['name' => 'weekly.index', 'uri' => '/Weekly'],
            ['name' => 'attendance.index', 'uri' => '/Attendance'],
            ['name' => 'bank_reconciliation.workspace', 'uri' => '/BankReconciliation/reconciliation-workspace'],
            ['name' => 'imports.history.index', 'uri' => '/Imports/history'],
            ['name' => 'users.index', 'uri' => '/Users'],
            ['name' => 'roles.index', 'uri' => '/Roles'],
            ['name' => 'settings.database-connection.edit', 'uri' => '/settings/database-connection'],
        ];

        $currentUser = $request->user();
        $routeResults = [];
        $overallHealthy = true;
        $healthyCount = 0;
        $unhealthyCount = 0;

        foreach ($targetRoutes as $target) {
            $startTime = microtime(true);
            $statusCode = 500;
            $statusLabel = 'UNHEALTHY';
            $errorDetails = null;

            try {
                $subRequest = Request::create($target['uri'], 'GET');
                if ($currentUser) {
                    $subRequest->setUserResolver(fn () => $currentUser);
                }

                $response = app()->handle($subRequest);
                $statusCode = $response->getStatusCode();
                $executionMs = round((microtime(true) - $startTime) * 1000, 2);

                if ($statusCode >= 200 && $statusCode < 400) {
                    $statusLabel = $executionMs > 1000 ? 'DEGRADED' : 'HEALTHY';
                    $healthyCount++;
                } else {
                    $statusLabel = 'UNHEALTHY';
                    $overallHealthy = false;
                    $unhealthyCount++;
                    $errorDetails = "HTTP {$statusCode} error on route {$target['name']}";
                }
            } catch (\Throwable $e) {
                $executionMs = round((microtime(true) - $startTime) * 1000, 2);
                $statusLabel = 'UNHEALTHY';
                $overallHealthy = false;
                $unhealthyCount++;
                $errorDetails = $e->getMessage();
            }

            $routeResults[] = [
                'name' => $target['name'],
                'uri' => $target['uri'],
                'http_status' => $statusCode,
                'health' => $statusLabel,
                'latency_ms' => $executionMs,
                'error' => $errorDetails,
            ];
        }

        return response()->json([
            'system_status' => $overallHealthy ? 'ALL_SYSTEMS_OPERATIONAL' : 'DEGRADED_OR_UNHEALTHY',
            'timestamp' => now()->toIso8601String(),
            'stats' => [
                'total_routes_checked' => count($targetRoutes),
                'healthy_count' => $healthyCount,
                'unhealthy_count' => $unhealthyCount,
            ],
            'routes' => $routeResults,
        ]);
    }
}
