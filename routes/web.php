<?php

use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\BankReconciliationController;
use App\Http\Controllers\BankReconciliationImportController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\HaciendaController;
use App\Http\Controllers\ImportJobStatusController;
use App\Http\Controllers\ImportMappingController;
use App\Http\Controllers\MillingPeriodsController;
use App\Http\Controllers\PayrollController;
use App\Http\Controllers\PlanterController;
use App\Http\Controllers\ProductionController;
use App\Http\Controllers\WeeklyController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect()->route('login');
})->name('home');

// Authenticated Routes
Route::middleware(['auth', 'verified'])->group(function () {

    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // --- User Management ---
    Route::middleware('permission:users.view')->group(function () {
        Route::get('/Users', [UserController::class, 'index'])->name('users.index');
        Route::get('/Users/{id}', [UserController::class, 'show'])->name('users.show');
    });
    Route::post('/Users', [UserController::class, 'store'])
        ->middleware('permission:users.create')
        ->name('users.store');
    Route::patch('/Users/bulk-update', [UserController::class, 'bulkUpdate'])
        ->middleware('permission:users.update')
        ->name('users.bulk-update');
    Route::patch('/Users/{id}', [UserController::class, 'update'])
        ->middleware('permission:users.update')
        ->name('users.update');
    Route::delete('/Users/bulk-delete', [UserController::class, 'bulkDestroy'])
        ->middleware('permission:users.delete')
        ->name('users.bulk-destroy');
    Route::delete('/Users/{id}', [UserController::class, 'destroy'])
        ->middleware('permission:users.delete')
        ->name('users.destroy');

    // --- Role Management ---
    Route::middleware('permission:roles.view')->group(function () {
        Route::get('/Roles', [RoleController::class, 'index'])->name('roles.index');
        Route::get('/Roles/{role}', [RoleController::class, 'show'])->name('roles.show');
    });
    Route::post('/Roles', [RoleController::class, 'store'])
        ->middleware('permission:roles.create')
        ->name('roles.store');
    Route::patch('/Roles/{role}', [RoleController::class, 'update'])
        ->middleware('permission:roles.update')
        ->name('roles.update');
    Route::delete('/Roles/{role}', [RoleController::class, 'destroy'])
        ->middleware('permission:roles.delete')
        ->name('roles.destroy');

    // --- Employees ---
    Route::middleware('permission:employees.view')->group(function () {
        Route::get('/Employees', [EmployeeController::class, 'index'])->name('employees.index');
        Route::get('/Employees/{Employee}', [EmployeeController::class, 'show'])
            ->whereNumber('Employee')
            ->name('employees.show');
    });
    Route::post('/Employees', [EmployeeController::class, 'store'])
        ->middleware('permission:employees.create')
        ->name('employees.store');
    Route::get('/Employees/create', [EmployeeController::class, 'create'])
        ->middleware('permission:employees.create')
        ->name('employees.create');
    Route::get('/Employees/{Employee}/edit', [EmployeeController::class, 'edit'])
        ->whereNumber('Employee')
        ->middleware('permission:employees.update')
        ->name('employees.edit');
    Route::match(['put', 'patch'], '/Employees/{Employee}', [EmployeeController::class, 'update'])
        ->whereNumber('Employee')
        ->middleware('permission:employees.update')
        ->name('employees.update');
    Route::patch('/Employees/bulk-update', [EmployeeController::class, 'bulkUpdate'])
        ->middleware('permission:employees.update')
        ->name('employees.bulk-update');
    Route::patch('/Employees/hourly-rate-settings', [EmployeeController::class, 'updateHourlyRateSettings'])
        ->middleware('permission:employees.update')
        ->name('employees.hourly-rate-settings');
    Route::delete('/Employees/bulk-delete', [EmployeeController::class, 'bulkDestroy'])
        ->middleware('permission:employees.delete')
        ->name('employees.bulk-destroy');
    Route::delete('/Employees/{Employee}', [EmployeeController::class, 'destroy'])
        ->whereNumber('Employee')
        ->middleware('permission:employees.delete')
        ->name('employees.destroy');

    // --- Attendance ---
    Route::middleware('permission:attendance.view')->group(function () {
        Route::get('/Attendance', [AttendanceController::class, 'index'])->name('attendance.index');
        Route::get('/Attendance/{Attendance}', [AttendanceController::class, 'show'])
            ->whereNumber('Attendance')
            ->name('attendance.show');
    });
    Route::post('/Attendance', [AttendanceController::class, 'store'])
        ->middleware('permission:attendance.create')
        ->name('attendance.store');
    Route::get('/Attendance/create', [AttendanceController::class, 'create'])
        ->middleware('permission:attendance.create')
        ->name('attendance.create');
    Route::get('/Attendance/{Attendance}/edit', [AttendanceController::class, 'edit'])
        ->whereNumber('Attendance')
        ->middleware('permission:attendance.update')
        ->name('attendance.edit');
    Route::match(['put', 'patch'], '/Attendance/{Attendance}', [AttendanceController::class, 'update'])
        ->whereNumber('Attendance')
        ->middleware('permission:attendance.update')
        ->name('attendance.update');
    Route::patch('/Attendance/bulk-update', [AttendanceController::class, 'bulkUpdate'])
        ->middleware('permission:attendance.update')
        ->name('attendance.bulk-update');
    Route::post('/Attendance/import', [AttendanceController::class, 'import'])
        ->middleware('permission:attendance.import')
        ->name('attendance.import');
    Route::delete('/Attendance/bulk-delete', [AttendanceController::class, 'bulkDestroy'])
        ->middleware('permission:attendance.delete')
        ->name('attendance.bulk-destroy');
    Route::delete('/Attendance/{Attendance}', [AttendanceController::class, 'destroy'])
        ->whereNumber('Attendance')
        ->middleware('permission:attendance.delete')
        ->name('attendance.destroy');

    // --- Payroll ---
    Route::middleware('permission:payroll.view')->group(function () {
        Route::get('/Payroll', [PayrollController::class, 'index'])->name('payroll.index');
        Route::get('/Payroll/{Payroll}', [PayrollController::class, 'show'])
            ->whereNumber('Payroll')
            ->name('payroll.show');
    });
    Route::post('/Payroll', [PayrollController::class, 'store'])
        ->middleware('permission:payroll.create')
        ->name('payroll.store');
    Route::get('/Payroll/create', [PayrollController::class, 'create'])
        ->middleware('permission:payroll.create')
        ->name('payroll.create');
    Route::get('/Payroll/{Payroll}/edit', [PayrollController::class, 'edit'])
        ->whereNumber('Payroll')
        ->middleware('permission:payroll.update')
        ->name('payroll.edit');
    Route::match(['put', 'patch'], '/Payroll/{Payroll}', [PayrollController::class, 'update'])
        ->whereNumber('Payroll')
        ->middleware('permission:payroll.update')
        ->name('payroll.update');
    Route::patch('/Payroll/bulk-update', [PayrollController::class, 'bulkUpdate'])
        ->middleware('permission:payroll.update')
        ->name('payroll.bulk-update');
    Route::post('/Payroll/preview', [PayrollController::class, 'preview'])
        ->middleware('permission:payroll.generate')
        ->name('payroll.preview');
    Route::post('/Payroll/generate', [PayrollController::class, 'generate'])
        ->middleware('permission:payroll.generate')
        ->name('payroll.generate');
    Route::patch('/Payroll/{payroll}/status', [PayrollController::class, 'updateStatus'])
        ->middleware('permission:payroll.update')
        ->name('payroll.update-status');
    Route::delete('/Payroll/bulk-delete', [PayrollController::class, 'bulkDestroy'])
        ->middleware('permission:payroll.delete')
        ->name('payroll.bulk-destroy');
    Route::delete('/Payroll/{Payroll}', [PayrollController::class, 'destroy'])
        ->whereNumber('Payroll')
        ->middleware('permission:payroll.delete')
        ->name('payroll.destroy');

    // --- Milling Periods ---
    Route::middleware('permission:milling_periods.view')->group(function () {
        Route::get('/MillingPeriods', [MillingPeriodsController::class, 'index'])->name('milling-periods.index');
        Route::get('/MillingPeriods/sugar-factor', [MillingPeriodsController::class, 'sugarFactor'])
            ->name('milling-periods.sugar-factor');
        Route::get('/MillingPeriods/{MillingPeriod}', [MillingPeriodsController::class, 'show'])
            ->whereNumber('MillingPeriod')
            ->name('milling-periods.show');
    });
    Route::post('/MillingPeriods', [MillingPeriodsController::class, 'store'])
        ->middleware('permission:milling_periods.create')
        ->name('milling-periods.store');
    Route::get('/MillingPeriods/create', [MillingPeriodsController::class, 'create'])
        ->middleware('permission:milling_periods.create')
        ->name('milling-periods.create');
    Route::get('/MillingPeriods/{MillingPeriod}/edit', [MillingPeriodsController::class, 'edit'])
        ->whereNumber('MillingPeriod')
        ->middleware('permission:milling_periods.update')
        ->name('milling-periods.edit');
    Route::match(['put', 'patch'], '/MillingPeriods/{MillingPeriod}', [MillingPeriodsController::class, 'update'])
        ->whereNumber('MillingPeriod')
        ->middleware('permission:milling_periods.update')
        ->name('milling-periods.update');
    Route::patch('/MillingPeriods/bulk-update', [MillingPeriodsController::class, 'bulkUpdate'])
        ->middleware('permission:milling_periods.update')
        ->name('milling-periods.bulk-update');
    Route::delete('/MillingPeriods/bulk-delete', [MillingPeriodsController::class, 'bulkDestroy'])
        ->middleware('permission:milling_periods.delete')
        ->name('milling-periods.bulk-destroy');
    Route::delete('/MillingPeriods/{MillingPeriod}', [MillingPeriodsController::class, 'destroy'])
        ->whereNumber('MillingPeriod')
        ->middleware('permission:milling_periods.delete')
        ->name('milling-periods.destroy');

    // Shared import helpers (need at least one import-capable permission on related modules)
    Route::post('/Imports/preview', [ImportMappingController::class, 'preview'])
        ->middleware('permission:planters.import|productions.import|attendance.import|weekly.create|bank_reconciliation.create')
        ->name('imports.preview');
    Route::post('/Imports/mappings', [ImportMappingController::class, 'store'])
        ->middleware('permission:planters.import|productions.import|attendance.import|weekly.create|bank_reconciliation.create')
        ->name('imports.mappings.store');
    Route::get('/Imports/status/{importJob}', [ImportJobStatusController::class, 'show'])
        ->middleware('auth')
        ->name('imports.status');

    // --- Planters ---
    Route::prefix('Planters')->name('planters.')->group(function () {
        Route::get('/', [PlanterController::class, 'index'])
            ->middleware('permission:planters.view')
            ->name('index');
        Route::get('/data', [PlanterController::class, 'data'])
            ->middleware('permission:planters.view')
            ->name('data');
        Route::get('/view/info/{id}', [PlanterController::class, 'show'])
            ->middleware('permission:planters.view')
            ->name('show');
        Route::get('/create', [PlanterController::class, 'create'])
            ->middleware('permission:planters.create')
            ->name('create');
        Route::post('/create', [PlanterController::class, 'store'])
            ->middleware('permission:planters.create')
            ->name('store');
        Route::patch('/view/info/{planterid}', [PlanterController::class, 'update'])
            ->middleware('permission:planters.update')
            ->name('update');
        Route::patch('/bulk-update', [PlanterController::class, 'bulkUpdate'])
            ->middleware('permission:planters.update')
            ->name('bulk-update');
        Route::delete('/bulk-delete', [PlanterController::class, 'bulkDestroy'])
            ->middleware('permission:planters.delete')
            ->name('bulk-destroy');
        Route::delete('/delete/{id}', [PlanterController::class, 'destroy'])
            ->middleware('permission:planters.delete')
            ->name('destroy');
        Route::post('/import', [PlanterController::class, 'import'])
            ->middleware('permission:planters.import')
            ->name('import');
    });

    // --- Productions ---
    Route::prefix('Productions')->name('productions.')->group(function () {
        Route::get('/', [ProductionController::class, 'index'])
            ->middleware('permission:productions.view')
            ->name('index');
        Route::get('/view/{productionId}', [ProductionController::class, 'show'])
            ->middleware('permission:productions.view')
            ->name('show');
        Route::get('/{id}/final-data', [ProductionController::class, 'finalData'])
            ->middleware('permission:productions.view')
            ->name('final_data');
        Route::get('/certification', [ProductionController::class, 'certification'])
            ->middleware('permission:productions.view')
            ->name('certification');
        Route::get('/bulk-download', [ProductionController::class, 'bulkDownload'])
            ->middleware('permission:productions.view')
            ->name('bulk_download');
        Route::patch('/view/update/{productionId}', [ProductionController::class, 'update'])
            ->middleware('permission:productions.update')
            ->name('update');
        Route::patch('/bulk-update', [ProductionController::class, 'bulkUpdate'])
            ->middleware('permission:productions.update')
            ->name('bulk-update');
        Route::patch('/view/{productionId}/status', [ProductionController::class, 'updateStatus'])
            ->middleware('permission:productions.update')
            ->name('update-status');
        Route::post('/import', [ProductionController::class, 'import'])
            ->middleware('permission:productions.import')
            ->name('import');
        Route::delete('/bulk-delete', [ProductionController::class, 'bulkDestroy'])
            ->middleware('permission:productions.delete')
            ->name('bulk-destroy');
        Route::delete('/delete-by-crop-year', [ProductionController::class, 'destroyByCropYear'])
            ->middleware('permission:productions.delete')
            ->name('destroy-by-crop-year');
        Route::delete('/delete/{productionId}', [ProductionController::class, 'destroy'])
            ->middleware('permission:productions.delete')
            ->name('destroy');
    });

    // --- Haciendas ---
    Route::prefix('Haciendas')->name('haciendas.')->group(function () {
        Route::get('/', [HaciendaController::class, 'index'])
            ->middleware('permission:haciendas.view')
            ->name('index');
        Route::get('/view/{haciendaId}', [HaciendaController::class, 'show'])
            ->middleware('permission:haciendas.view')
            ->name('show');
        Route::get('/create/{planterId}', [HaciendaController::class, 'create'])
            ->middleware('permission:haciendas.create')
            ->name('create');
        Route::post('/create/{planterId}', [HaciendaController::class, 'store'])
            ->middleware('permission:haciendas.create')
            ->name('store');
        Route::patch('/view/update/{haciendaId}', [HaciendaController::class, 'update'])
            ->middleware('permission:haciendas.update')
            ->name('update');
        Route::patch('/bulk-update', [HaciendaController::class, 'bulkUpdate'])
            ->middleware('permission:haciendas.update')
            ->name('bulk-update');
        Route::delete('/bulk-delete', [HaciendaController::class, 'bulkDestroy'])
            ->middleware('permission:haciendas.delete')
            ->name('bulk-destroy');
    });

    // --- Weekly ---
    Route::prefix('Weekly')->name('weekly.')->group(function () {
        Route::get('/', [WeeklyController::class, 'index'])
            ->middleware('permission:weekly.view')
            ->name('index');
        Route::get('/{weekly}', [WeeklyController::class, 'show'])
            ->middleware('permission:weekly.view')
            ->name('show');
        Route::get('/{weekly}/download', [WeeklyController::class, 'download'])
            ->middleware('permission:weekly.view')
            ->name('download');
        Route::post('/import', [WeeklyController::class, 'store'])
            ->middleware('permission:weekly.create')
            ->name('import');
        Route::delete('/clear', [WeeklyController::class, 'clear'])
            ->middleware('permission:weekly.delete')
            ->name('clear');
        Route::delete('/delete-by-crop-year-week', [WeeklyController::class, 'destroyByCropYearWeek'])
            ->middleware('permission:weekly.delete')
            ->name('destroy-by-crop-year-week');
    });

    // --- Bank Reconciliation ---
    Route::prefix('BankReconciliation')->name('bank_reconciliation.')->group(function () {
        Route::get('/', [BankReconciliationController::class, 'index'])
            ->middleware('permission:bank_reconciliation.view')
            ->name('index');
        Route::get('/{bankReconciliation}', [BankReconciliationController::class, 'show'])
            ->middleware('permission:bank_reconciliation.view')
            ->name('show');
        Route::get('/{bankReconciliation}/download', [BankReconciliationController::class, 'download'])
            ->middleware('permission:bank_reconciliation.view')
            ->name('download');
        Route::post('/import', [BankReconciliationController::class, 'store'])
            ->middleware('permission:bank_reconciliation.create')
            ->name('import');
        Route::delete('/clear', [BankReconciliationController::class, 'clear'])
            ->middleware('permission:bank_reconciliation.delete')
            ->name('clear');
        Route::delete('/bulk-delete', [BankReconciliationController::class, 'bulkDestroy'])
            ->middleware('permission:bank_reconciliation.delete')
            ->name('bulk-destroy');
        Route::delete('/delete-by-crop-year-week', [BankReconciliationController::class, 'destroyByCropYearWeek'])
            ->middleware('permission:bank_reconciliation.delete')
            ->name('destroy-by-crop-year-week');
    });

    Route::post('/bank-reconciliation-import/import', [BankReconciliationImportController::class, 'import'])
        ->middleware('permission:bank_reconciliation.create')
        ->name('bank-reconciliation-import.import');
});

require __DIR__.'/settings.php';
