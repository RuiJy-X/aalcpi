<?php
use App\Http\Controllers\PlanterController;
use App\Http\Controllers\EmployeeController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
Route::get('/', function () {
    return redirect()->route('login');
})->name('home');

Route::get('dashboard', function () {
    return Inertia::render('dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::get('/Planters', function () {return Inertia::render('Planters/Index');})->middleware(['auth', 'verified'])->name('planters.index');

Route::resource('/Employees', EmployeeController::class)->middleware(['auth', 'verified']);

require __DIR__.'/settings.php';
