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

Route::get('/Planters', [PlanterController::class, 'index'])->middleware(['auth', 'verified'])->name('planters.index');
Route::get('/Planters/Create', [PlanterController::class, 'create'])->middleware(['auth','verified'])->name('planters.create');
Route::post('/Planters/Create', [PlanterController::class, 'store'])
    ->middleware(['auth','verified'])
    ->name('planters.store');

Route::get('/Employees', [EmployeeController::class, 'index'])->middleware(['auth', 'verified'])->name('employees.index');

require __DIR__.'/settings.php';
