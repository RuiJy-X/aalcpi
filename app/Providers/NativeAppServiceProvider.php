<?php

namespace App\Providers;

use Native\Desktop\Facades\Window;
use Native\Desktop\Contracts\ProvidesPhpIni;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;

class NativeAppServiceProvider implements ProvidesPhpIni
{
    /**
     * Executed once the native application has been booted.
     * Use this method to open windows, register global shortcuts, etc.
     */
    public function boot(): void
    {
        Artisan::call('migrate', ['--force' => true]);

        $this->seedUsersIfNeeded();

        Window::open()->width(800)->height(600)->maximized();
    }

    /**
     * Return an array of php.ini directives to be set.
     */
    public function phpIni(): array
    {
        return [
            'memory_limit' => '512M',
            'upload_max_filesize' => '100M',
            'post_max_size' => '100M',
            'display_errors' => '1',
        ];
    }

    protected function seedUsersIfNeeded(): void
    {
        // Example safety check: Only seed if the users table is completely empty
        if (\App\Models\User::count() === 0) {
            try {
                Artisan::call('db:seed', [
                    '--class' => 'AdminSeeder',
                    '--force' => true // Required in production environments
                ]);
            } catch (\Exception $e) {
                Log::error('Failed to seed desktop users: ' . $e->getMessage());
            }
        }
    }
}
