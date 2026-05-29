<?php
use App\Http\Controllers\PlanterController;
use App\Http\Controllers\ProductionController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\ImportMappingController;
use App\Http\Controllers\ImportJobStatusController;
use App\Http\Controllers\MillingPeriodsController;
use App\Http\Controllers\HaciendaController;
use App\Http\Controllers\WeeklyController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\PayrollController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect()->route('login');
})->name('home');

// Authenticated Routes
Route::middleware(['auth', 'verified'])->group(function () {

    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');


    // --- MANAGER ---
    Route::middleware('role:manager,admin')->group(function () {
        // User Management
        Route::get('/Users', [UserController::class, 'index'])->name('users.index');
        Route::post('/Users', [UserController::class, 'store'])->name('users.store');
        Route::delete('/Users/bulk-delete', [UserController::class, 'bulkDestroy'])->name('users.bulk-destroy');
        Route::delete('/Users/{id}', [UserController::class, 'destroy'])->name('users.destroy');
        Route::get('/Users/{id}', [UserController::class, 'show'])->name('users.show');

        Route::delete('/Employees/bulk-delete', [EmployeeController::class, 'bulkDestroy'])->name('employees.bulk-destroy');
        Route::resource('/Employees', EmployeeController::class)->whereNumber('Employee');
        Route::patch(
            '/Employees/hourly-rate-settings',
            [EmployeeController::class, 'updateHourlyRateSettings']
        )->name('employees.hourly-rate-settings');
        // Add later the other routes like payroll, attendance, ... of all the employees records

        Route::post('/Attendance/import', [AttendanceController::class, 'import'])->name('attendance.import');

        Route::delete('/Attendance/bulk-delete', [AttendanceController::class, 'bulkDestroy'])->name('attendance.bulk-destroy');
        Route::resource('/Attendance', AttendanceController::class)->whereNumber('Attendance');

        Route::post('/Payroll/preview', [PayrollController::class, 'preview'])->name('payroll.preview');
        Route::post('/Payroll/generate', [PayrollController::class, 'generate'])->name('payroll.generate');
        Route::patch('/Payroll/{payroll}/status', [PayrollController::class, 'updateStatus'])->name('payroll.update-status');
        Route::delete('/Payroll/bulk-delete', [PayrollController::class, 'bulkDestroy'])->name('payroll.bulk-destroy');
        Route::resource('/Payroll', PayrollController::class)->whereNumber('Payroll');

        Route::delete('/MillingPeriods/bulk-delete', [MillingPeriodsController::class, 'bulkDestroy'])->name('milling-periods.bulk-destroy');

        Route::get('/MillingPeriods/sugar-factor', [MillingPeriodsController::class, 'sugarFactor'])->name('milling-periods.sugar-factor');

        Route::resource('/MillingPeriods', MillingPeriodsController::class)
            ->whereNumber('MillingPeriod');


    });

    // --- MANAGER & CERTIFICATION OFFICER ---
    Route::middleware('role:manager,cert_officer,employee,admin')->group(function () {

        Route::post('/Imports/preview', [ImportMappingController::class, 'preview'])->name('imports.preview');
        Route::post('/Imports/mappings', [ImportMappingController::class, 'store'])->name('imports.mappings.store');
        Route::get('/Imports/status/{importJob}', [ImportJobStatusController::class, 'show'])->name('imports.status');

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
            Route::get('/certification', [ProductionController::class,'certification'])->name('certification');
            Route::get('/bulk-download', [ProductionController::class,'bulkDownload'])->name('bulk_download');
            Route::patch('/view/update/{productionId}', [ProductionController::class,'update'])->name('update');
            Route::post('/import', [ProductionController::class,'import'])->name('import');
            Route::delete('/bulk-delete', [ProductionController::class, 'bulkDestroy'])->name('bulk-destroy');
            Route::delete('/delete-by-crop-year', [ProductionController::class, 'destroyByCropYear'])->name('destroy-by-crop-year');
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



        Route::prefix('Weekly')->name('weekly.')->group(function () {
            Route::get('/', [WeeklyController::class, 'index'])->name('index');
            Route::post('/import', [WeeklyController::class, 'store'])->name('import');
            Route::delete('/clear', [WeeklyController::class, 'clear'])->name('clear');
            Route::delete('/delete-by-crop-year-week', [WeeklyController::class, 'destroyByCropYearWeek'])->name('destroy-by-crop-year-week');
            Route::get('/{weekly}', [WeeklyController::class, 'show'])->name('show');
            Route::get('/{weekly}/download', [WeeklyController::class, 'download'])->name('download');
        });
    });

    // --- NORMAL EMPLOYEE ---
    // They only have access to their dashboard and "Settings"
    // Future routes for "My Payroll" will go here.
});

require __DIR__.'/settings.php';
