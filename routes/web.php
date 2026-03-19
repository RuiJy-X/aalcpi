<?php
use App\Http\Controllers\PlanterController;
use App\Http\Controllers\ProductionController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\CertificationController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\PayrollController;
use App\Http\Controllers\HaciendaController;
use App\Http\Controllers\UserController; // Import this!
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return redirect()->route('login');
})->name('home');

// Authenticated Routes
Route::middleware(['auth', 'verified'])->group(function () {
    
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    // --- MANAGER ---
    Route::middleware('role:manager')->group(function () {
        // User Management (This is where you use UserController)
        Route::get('/Users', [UserController::class, 'index'])->name('users.index');
        Route::post('/Users', [UserController::class, 'store'])->name('users.store');
        Route::delete('/Users/{id}', [UserController::class, 'destroy'])->name('users.destroy');

        Route::get('/Employees', [EmployeeController::class, 'index'])->name('employees.index');
        // Add later the other routes like payroll, attendance, ... of all the employees records
    });

    // --- MANAGER & CERTIFICATION OFFICER ---
    Route::middleware('role:manager,cert_officer')->group(function () {
        
        // Planters
        Route::prefix('Planters')->name('planters.')->group(function () {
            Route::get('/', [PlanterController::class, 'index'])->name('index');
            Route::get('/create', [PlanterController::class,'create'])->name('create');
            Route::post('/create', [PlanterController::class, 'store'])->name('store');
            Route::get('/data', [PlanterController::class, 'data'])->name('data');
            Route::get('/view/info/{id}', [PlanterController::class,'show'])->name('show');
            Route::patch('/view/info/{planterid}',[PlanterController::class,'update'])->name('update');
            Route::delete('/bulk-delete', [PlanterController::class,'bulkDestroy'])->name('bulk-destroy');
            Route::delete('/delete/{id}', [PlanterController::class,'destroy'])->name('destroy');
            Route::post('/import', [PlanterController::class,'import'])->name('import');
        });

        // Productions
        Route::prefix('Productions')->name('productions.')->group(function () {
            Route::get('/', [ProductionController::class, 'index'])->name('index');
            Route::get('/view/{productionId}', [ProductionController::class,'show'])->name('show');
            Route::get('/{id}/final-data', [ProductionController::class,'finalData'])->name('final_data');
            Route::get('/bulk-download', [ProductionController::class,'bulkDownload'])->name('bulk_download');
            Route::patch('/view/update/{productionId}', [ProductionController::class,'update'])->name('update');
            Route::post('/import', [ProductionController::class,'import'])->name('import');
            Route::delete('/bulk-delete', [ProductionController::class, 'bulkDestroy'])->name('bulk-destroy');
            Route::delete('/delete/{productionId}', [ProductionController::class, 'destroy'])->name('destroy');
        });

        // Haciendas
        Route::prefix('Haciendas')->name('haciendas.')->group(function () {
            Route::get('/', [HaciendaController::class, 'index'])->name('index');
            Route::get('/view/{haciendaId}', [HaciendaController::class,'show'])->name('show');
            Route::get('/create/{planterId}', [HaciendaController::class,'create'])->name('create');
            Route::post('/create/{planterId}', [HaciendaController::class,'store'])->name('store');
            Route::patch('/view/update/{haciendaId}', [HaciendaController::class,'update'])->name('update');
            Route::delete('/bulk-delete', [HaciendaController::class,'bulkDestroy'])->name('bulk-destroy');
        });

        // Certifications
        Route::prefix('Certifications')->name('certifications.')->group(function () {
            Route::get('/', [CertificationController::class, 'index'])->name('index');
            Route::get('/data', [CertificationController::class, 'get'])->name('data');
            Route::delete('/bulk-delete', [CertificationController::class, 'bulkDestroy'])->name('bulk-destroy');
        });
    });

    // --- NORMAL EMPLOYEE ---
    // They only have access to their dashboard and "Settings"
    // Future routes for "My Payroll" will go here.
});

require __DIR__.'/settings.php';