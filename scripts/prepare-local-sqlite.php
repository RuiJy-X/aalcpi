<?php

/**
 * One-off helper: migrate + seed roles on database.sqlite and nativephp.sqlite.
 * Usage: php scripts/prepare-local-sqlite.php
 */

require __DIR__.'/../vendor/autoload.php';

$app = require __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Kernel::class);
$kernel->bootstrap();

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

$targets = [
    'sqlite' => database_path('database.sqlite'),
    'nativephp' => database_path('nativephp.sqlite'),
];

foreach ($targets as $name => $path) {
    echo "=== {$name} ({$path}) ===".PHP_EOL;

    if (! file_exists($path)) {
        touch($path);
        echo 'Created empty file.'.PHP_EOL;
    }

    config([
        "database.connections.{$name}" => [
            'driver' => 'sqlite',
            'database' => $path,
            'prefix' => '',
            'foreign_key_constraints' => true,
        ],
        'database.default' => $name,
    ]);

    DB::purge($name);

    Artisan::call('migrate', [
        '--database' => $name,
        '--force' => true,
    ]);
    echo Artisan::output();

    if (Schema::connection($name)->hasTable('roles') && ! DB::connection($name)->table('roles')->exists()) {
        Artisan::call('db:seed', [
            '--class' => 'RolePermissionSeeder',
            '--force' => true,
        ]);
        echo Artisan::output();
    }

    if (Schema::connection($name)->hasTable('users') && DB::connection($name)->table('users')->count() === 0) {
        Artisan::call('db:seed', [
            '--class' => 'AdminSeeder',
            '--force' => true,
        ]);
        echo Artisan::output();
    }

    echo 'roles table: '.(Schema::connection($name)->hasTable('roles') ? 'yes' : 'no').PHP_EOL;
    if (Schema::connection($name)->hasTable('roles')) {
        echo 'roles count: '.DB::connection($name)->table('roles')->count().PHP_EOL;
    }
    if (Schema::connection($name)->hasTable('users')) {
        echo 'users count: '.DB::connection($name)->table('users')->count().PHP_EOL;
    }
    echo PHP_EOL;
}

echo 'Done.'.PHP_EOL;
