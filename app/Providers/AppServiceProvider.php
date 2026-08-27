<?php

namespace App\Providers;

use App\Models\User;
use App\Services\DatabaseConfigurationService;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->ensureStorageDirectoriesExist();
        $this->configureDefaults();
        $this->configureAuthorization();
        DatabaseConfigurationService::loadActiveConnection();
    }

    protected function ensureStorageDirectoriesExist(): void
    {
        $directories = [
            storage_path('fonts'),
            storage_path('framework/cache'),
            storage_path('framework/views'),
            storage_path('framework/sessions'),
            storage_path('app/temp'),
        ];

        foreach ($directories as $directory) {
            if (! is_dir($directory)) {
                @mkdir($directory, 0755, true);
            }
        }
    }

    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null
        );
    }

    /**
     * Super admins bypass all permission checks.
     */
    protected function configureAuthorization(): void
    {
        Gate::before(function ($user, string $ability) {
            if ($user instanceof User && $user->isSuperAdmin()) {
                return true;
            }

            return null;
        });
    }
}
