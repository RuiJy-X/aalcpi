<?php
use App\Http\Controllers\PlanterController;
use App\Http\Controllers\ProductionController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\CertificationController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\PayrollController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
Route::get('/', function () {
    return redirect()->route('login');
})->name('home');

Route::get('dashboard', function () {
    return Inertia::render('dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::get('/Planters', [PlanterController::class, 'index'])->middleware(['auth', 'verified'])->name('planters.index');

Route::get('Planters/create', [PlanterController::class,'create'])->middleware(['auth', 'verified'])->name('planters.create');

Route::post('/Planters/create', [PlanterController::class, 'store'])->middleware(['auth', 'verified'])->name('planters.store');

Route::get('/Planters/data', [PlanterController::class, 'data'])->middleware(['auth', 'verified'])->name('planters.data');

Route::get('Planters/view/info/{id}', [PlanterController::class,'view'])->middleware(['auth', 'verified'])->name('planters.view');

Route::get('/Planters/view/info/{planterId}/production/{productionId}', [PlanterController::class,'viewProduction'])->middleware(['auth', 'verified'])->name('planters.view.production');

Route::get('/Planters/view/info/{planterId}/land/{landId}', [PlanterController::class,'viewLand'])->middleware(['auth', 'verified'])->name('planters.view.land');

Route::get('Planters/view/info/{planterId}/certificate/{certificateId}', [PlanterController::class,'viewCertificates'])->middleware(['auth', 'verified'])->name('planters.view.certificate');

Route::get('/Employees', [EmployeeController::class, 'index'])->middleware(['auth', 'verified'])->name('employees.index');

Route::get('/Certifications/data', [CertificationController::class, 'get'])->middleware(['auth', 'verified'])->name('certifications.data');

require __DIR__.'/settings.php';
