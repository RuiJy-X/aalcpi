<?php
use App\Http\Controllers\PlanterController;
use App\Http\Controllers\PlanterViewController;
use App\Http\Controllers\ProductionController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\CertificationController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\LandViewController;
use App\Http\Controllers\PayrollController;
use App\Http\Controllers\ProductionViewController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
Route::get('/', function () {
    return redirect()->route('login');
})->name('home');

Route::get('dashboard', function () {
    return Inertia::render('dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

// Planter
Route::get('/Planters', [PlanterController::class, 'index'])->middleware(['auth', 'verified'])->name('planters.index');
Route::get('Planters/create', [PlanterController::class,'create'])->middleware(['auth', 'verified'])->name('planters.create');
Route::post('/Planters/create', [PlanterController::class, 'store'])->middleware(['auth', 'verified'])->name('planters.store');
Route::get('/Planters/data', [PlanterController::class, 'data'])->middleware(['auth', 'verified'])->name('planters.data');


// Planter View
Route::get('Planters/view/info/{id}', [PlanterViewController::class,'index'])->middleware(['auth', 'verified'])->name('planters.view.info');
Route::patch('Planters/view/info/{planterid}',[PlanterViewController::class,'update'])->middleware(['auth', 'verified'])->name('planters.view.update');

// Planter view production
Route::get('/Planters/view/info/{planterId}/production/{productionId}', [ProductionViewController::class,'index'])->middleware(['auth', 'verified'])->name('planters.view.production');
Route::patch('/Planters/view/info/{planterId}/production/{productionId}', [ProductionViewController::class,'update'])->middleware(['auth', 'verified'])->name('planters.view.production.update');

// Planter view land
Route::get('/Planters/view/info/{planterId}/land/{landId}', [LandViewController::class,'index'])->middleware(['auth', 'verified'])->name('planters.view.land.index');
Route::patch('/Planters/view/info/{planterId}/land/{landId}', [LandViewController::class,'update'])->middleware(['auth', 'verified'])->name('planters.view.land.update');
Route::post('Planters/create/land', [LandViewController::class,'store'])->middleware(['auth', 'verified'])->name('planters.store.land');

// Planter view certifications
Route::get('Planters/view/info/{planterId}/certificate/{certificateId}', [PlanterController::class,'viewCertificates'])->middleware(['auth', 'verified'])->name('planters.view.certificate');

Route::get('/Employees', [EmployeeController::class, 'index'])->middleware(['auth', 'verified'])->name('employees.index');

Route::get('/Certifications/data', [CertificationController::class, 'get'])->middleware(['auth', 'verified'])->name('certifications.data');

require __DIR__.'/settings.php';
