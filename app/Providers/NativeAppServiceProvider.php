<?php

namespace App\Providers;

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Log;
use Native\Desktop\Contracts\ProvidesPhpIni;
use Native\Desktop\Events\AutoUpdater\Error as AutoUpdaterError;
use Native\Desktop\Events\AutoUpdater\UpdateAvailable;
use Native\Desktop\Events\AutoUpdater\UpdateDownloaded;
use Native\Desktop\Events\AutoUpdater\UpdateNotAvailable;
use Native\Desktop\Facades\AutoUpdater;
use Native\Desktop\Facades\Notification;
use Native\Desktop\Facades\Window;

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
        $this->registerAutoUpdaterHandlers();
        $this->checkForAppUpdates();

        Log::info('PHP binary: '.PHP_BINARY);
        Log::info('Extensions: '.implode(', ', get_loaded_extensions()));

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
            'extension' => 'xml',
        ];
    }

    /**
     * NativePHP Electron already checks on startup when updater.enabled is true.
     * This is an extra PHP-side check once the Laravel app is ready.
     */
    protected function checkForAppUpdates(): void
    {
        if (! config('nativephp.updater.enabled')) {
            return;
        }

        // Only production builds should poll for updates.
        if (! app()->isProduction() && ! $this->isNativeProductionBuild()) {
            return;
        }

        try {
            AutoUpdater::checkForUpdates();
            Log::info('NativePHP auto-updater: checking for updates', [
                'version' => config('nativephp.version'),
                'provider' => config('nativephp.updater.default'),
            ]);
        } catch (\Throwable $e) {
            Log::warning('NativePHP auto-updater check failed: '.$e->getMessage());
        }
    }

    protected function registerAutoUpdaterHandlers(): void
    {
        Event::listen(UpdateAvailable::class, function () {
            Log::info('NativePHP auto-updater: update available — downloading');
        });

        Event::listen(UpdateNotAvailable::class, function () {
            Log::info('NativePHP auto-updater: already on latest version', [
                'version' => config('nativephp.version'),
            ]);
        });

        Event::listen(UpdateDownloaded::class, function (UpdateDownloaded $event) {
            Log::info('NativePHP auto-updater: update downloaded', [
                'version' => $event->version ?? null,
            ]);

            try {
                Notification::title('Update ready')
                    ->message('A new version of '.config('app.name').' was downloaded. Restart the app to install it.')
                    ->show();
            } catch (\Throwable $e) {
                Log::warning('Could not show update notification: '.$e->getMessage());
            }
        });

        Event::listen(AutoUpdaterError::class, function (AutoUpdaterError $event) {
            Log::error('NativePHP auto-updater error: '.$event->name.' — '.$event->message);
        });
    }

    /**
     * Bundled NativePHP apps typically run as production; also treat
     * the presence of the packaged electron path as production.
     */
    protected function isNativeProductionBuild(): bool
    {
        return (bool) env('NATIVEPHP_RUNNING', false)
            && app()->environment('production');
    }

    protected function seedUsersIfNeeded(): void
    {
        if (\App\Models\User::count() === 0) {
            try {
                Artisan::call('db:seed', [
                    '--class' => 'AdminSeeder',
                    '--force' => true,
                ]);
            } catch (\Exception $e) {
                Log::error('Failed to seed desktop users: '.$e->getMessage());
            }
        }
    }
}
