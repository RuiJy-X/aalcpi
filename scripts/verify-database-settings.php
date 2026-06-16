#!/usr/bin/env php
<?php

/**
 * Database Settings Feature - Verification Script
 * 
 * This script verifies that all database settings feature components are properly installed
 * Usage: php scripts/verify-database-settings.php
 */

echo "=== Database Settings Feature Verification ===\n\n";

$checks = [];

// 1. Check if DatabaseConnection model exists
$checks['DatabaseConnection Model'] = file_exists(__DIR__ . '/../app/Models/DatabaseConnection.php');

// 2. Check if DatabaseConnectionController exists
$checks['DatabaseConnectionController'] = file_exists(__DIR__ . '/../app/Http/Controllers/Settings/DatabaseConnectionController.php');

// 3. Check if DatabaseConnectionStoreRequest exists
$checks['DatabaseConnectionStoreRequest'] = file_exists(__DIR__ . '/../app/Http/Requests/Settings/DatabaseConnectionStoreRequest.php');

// 4. Check if DatabaseConfigurationService exists
$checks['DatabaseConfigurationService'] = file_exists(__DIR__ . '/../app/Services/DatabaseConfigurationService.php');

// 5. Check if migration exists
$migrationExists = false;
$migrationsDir = __DIR__ . '/../database/migrations';
if (is_dir($migrationsDir)) {
    $files = scandir($migrationsDir);
    $migrationExists = array_filter($files, function ($file) {
        return strpos($file, 'create_database_connections_table') !== false;
    });
}
$checks['Database Migration'] = !empty($migrationExists);

// 6. Check if frontend component exists
$checks['Database Settings Component'] = file_exists(__DIR__ . '/../resources/js/pages/settings/database.tsx');

// 7. Check if routes are updated
$routesFile = file_get_contents(__DIR__ . '/../routes/settings.php');
$checks['Database Settings Routes'] = strpos($routesFile, 'DatabaseConnectionController') !== false;

// 8. Check if AppServiceProvider is updated
$appServiceProvider = file_get_contents(__DIR__ . '/../app/Providers/AppServiceProvider.php');
$checks['AppServiceProvider Updated'] = strpos($appServiceProvider, 'DatabaseConfigurationService::loadActiveConnection()') !== false;

// 9. Check if SettingsLayout is updated
$settingsLayout = file_get_contents(__DIR__ . '/../resources/js/layouts/settings/layout.tsx');
$checks['SettingsLayout Updated'] = strpos($settingsLayout, 'editDatabase') !== false || strpos($settingsLayout, "title: 'Database'") !== false;

// 10. Check documentation
$checks['Documentation'] = file_exists(__DIR__ . '/../docs/DATABASE_SETTINGS_GUIDE.md');

// Print results
echo "Component Verification Results:\n";
echo "================================\n\n";

$allPassed = true;
foreach ($checks as $component => $status) {
    $statusText = $status ? '✅ PASS' : '❌ FAIL';
    echo "[{$statusText}] {$component}\n";
    if (!$status) {
        $allPassed = false;
    }
}

echo "\n================================\n";
if ($allPassed) {
    echo "✅ All components are properly installed!\n\n";
    echo "Next steps:\n";
    echo "1. Run migrations: php artisan migrate\n";
    echo "2. Build frontend: npm run build\n";
    echo "3. Test the feature at Settings → Database\n";
} else {
    echo "❌ Some components are missing. Please check the installation.\n";
}

exit($allPassed ? 0 : 1);
