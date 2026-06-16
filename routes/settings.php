<?php

use App\Http\Controllers\Settings\PasswordController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\TwoFactorAuthenticationController;
use App\Http\Controllers\Settings\DatabaseConnectionController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware(['auth'])->group(function () {
    Route::redirect('settings', '/settings/profile');

    Route::get('settings/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('settings/profile', [ProfileController::class, 'update'])->name('profile.update');

    // Database Settings
    Route::get('settings/database', [DatabaseConnectionController::class, 'index'])->name('database.edit');
    Route::post('settings/database', [DatabaseConnectionController::class, 'store'])->name('database.store');
    Route::post('settings/database/test', [DatabaseConnectionController::class, 'test'])->name('database.test');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::delete('settings/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('settings/password', [PasswordController::class, 'edit'])->name('user-password.edit');

    Route::put('settings/password', [PasswordController::class, 'update'])
        ->middleware('throttle:6,1')
        ->name('user-password.update');

    Route::get('settings/appearance', function () {
        return Inertia::render('settings/appearance');
    })->name('appearance.edit');

    Route::get('settings/two-factor', [TwoFactorAuthenticationController::class, 'show'])
        ->name('two-factor.show');

    // Database Settings - Activate and Delete
    Route::post('settings/database/{connection}/activate', [DatabaseConnectionController::class, 'activate'])->name('database.activate');
    Route::delete('settings/database/{connection}', [DatabaseConnectionController::class, 'destroy'])->name('database.destroy');
});
