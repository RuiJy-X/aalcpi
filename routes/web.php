<?php
use App\Http\Controllers\PlanterController;
use App\Http\Controllers\ProductionController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\CertificationController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\PayrollController;
use App\Http\Controllers\HaciendaController;
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
Route::post('/Planters/import', [PlanterController::class,'import'])->middleware(['auth', 'verified'])->name('planters.import');

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

// Haciendas
Route::get('/Haciendas', [HaciendaController::class, 'index'])->middleware(['auth', 'verified'])->name('haciendas.index');
Route::get('/Haciendas/view/{haciendaId}', [HaciendaController::class,'show'])->middleware(['auth', 'verified'])->name('haciendas.show');
Route::get('/Haciendas/create/{planterId}', [HaciendaController::class,'create'])->middleware(['auth', 'verified'])->name('haciendas.create');
Route::post('/Haciendas/create/{planterId}', [HaciendaController::class,'store'])->middleware(['auth', 'verified'])->name('haciendas.store');
Route::delete('/Haciendas/bulk-delete', [HaciendaController::class,'bulkDestroy'])->middleware(['auth', 'verified'])->name('haciendas.bulk-destroy');
Route::patch('/Haciendas/view/update/{haciendaId}', [HaciendaController::class,'update'])->middleware(['auth', 'verified'])->name('haciendas.update');



// Certifications
Route::get('/Certifications', [CertificationController::class, 'index'])->middleware(['auth', 'verified'])->name('certifications.index');
Route::delete('/Certifications/bulk-delete', [CertificationController::class, 'bulkDestroy'])->middleware(['auth', 'verified'])->name('certifications.bulk-destroy');

Route::get('/Employees', [EmployeeController::class, 'index'])->middleware(['auth', 'verified'])->name('employees.index');

Route::get('/Certifications/data', [CertificationController::class, 'get'])->middleware(['auth', 'verified'])->name('certifications.data');

require __DIR__.'/settings.php';
