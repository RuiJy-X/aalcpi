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
use App\Http\Controllers\LandController;
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
Route::get('Planters/view/info/{id}', [PlanterController::class,'show'])->middleware(['auth', 'verified'])->name('planters.show');
Route::delete('/Planters/bulk-delete', [PlanterController::class,'bulkDestroy'])->middleware(['auth', 'verified'])->name('planters.bulk-destroy');
Route::delete('Planters/delete/{id}', [PlanterController::class,'destroy'])->middleware(['auth', 'verified'])->name('planters.destroy');
Route::patch('Planters/view/info/{planterid}',[PlanterController::class,'update'])->middleware(['auth', 'verified'])->name('planters.update');

// Route::get('/Planters/view/info/{planterId}/production/{productionId}', [ProductionViewController::class,'show'])->middleware(['auth', 'verified'])->name('planter.production.show');

// Production
Route::get('/Productions', [ProductionController::class, 'index'])->middleware(['auth', 'verified'])->name('productions.index');
Route::get('/Productions/view/{productionId}', [ProductionController::class,'show'])->middleware(['auth', 'verified'])->name('productions.show');
Route::delete('/Productions/bulk-delete', [ProductionController::class, 'bulkDestroy'])->middleware(['auth','verified'])->name('productions.bulk-destroy');
Route::delete('/Productions/delete/{productionId}', [ProductionController::class, 'destroy'])->middleware(['auth','verified'])->name('productions.destroy');
Route::patch('/Productions/view/update/{productionId}', [ProductionController::class,'update'])->middleware(['auth', 'verified'])->name('productions.update');
Route::post('/Productions/import', [ProductionController::class,'import'])->middleware(['auth', 'verified'])->name('productions.import');
Route::get('/Productions/{id}/final-data', [ProductionController::class,'finalData'])->middleware(['auth', 'verified'])->name('productions.final_data');
Route::get('/Productions/bulk-download', [ProductionController::class,'bulkDownload'])->middleware(['auth', 'verified'])->name('productions.bulk_download');

// Lands
Route::get('/Lands', [LandController::class, 'index'])->middleware(['auth', 'verified'])->name('lands.index');
Route::get('/Lands/view/{landId}', [LandController::class,'show'])->middleware(['auth', 'verified'])->name('lands.show');
Route::get('/Lands/create/{planterId}', [LandController::class,'create'])->middleware(['auth', 'verified'])->name('lands.create');
Route::post('/Lands/create/{planterId}', [LandController::class,'store'])->middleware(['auth', 'verified'])->name('lands.store');
Route::delete('/Lands/bulk-delete', [LandController::class,'bulkDestroy'])->middleware(['auth', 'verified'])->name('lands.bulk-destroy');
Route::patch('/Lands/view/update/{landId}', [LandController::class,'update'])->middleware(['auth', 'verified'])->name('lands.update');


// Planter view production
Route::patch('/Planters/view/info/{planterId}/production/{productionId}', [ProductionViewController::class,'update'])->middleware(['auth', 'verified'])->name('planters.view.production.update');

// Planter view land
// Route::get('/Planters/view/info/{planterId}/land/{landId}', [LandViewController::class,'index'])->middleware(['auth', 'verified'])->name('planters.view.land.index');
// Route::patch('/Planters/view/info/{planterId}/land/{landId}', [LandViewController::class,'update'])->middleware(['auth', 'verified'])->name('planters.view.land.update');
// Route::post('Planters/create/land', [LandViewController::class,'store'])->middleware(['auth', 'verified'])->name('planters.store.land');

// Planter view certifications
Route::get('Planters/view/info/{planterId}/certificate/{certificateId}', [PlanterController::class,'viewCertificates'])->middleware(['auth', 'verified'])->name('planters.view.certificate');


// Certifications
Route::get('/Certifications', [CertificationController::class, 'index'])->middleware(['auth', 'verified'])->name('certifications.index');
Route::delete('/Certifications/bulk-delete', [CertificationController::class, 'bulkDestroy'])->middleware(['auth', 'verified'])->name('certifications.bulk-destroy');

Route::get('/Employees', [EmployeeController::class, 'index'])->middleware(['auth', 'verified'])->name('employees.index');

Route::get('/Certifications/data', [CertificationController::class, 'get'])->middleware(['auth', 'verified'])->name('certifications.data');

require __DIR__.'/settings.php';
