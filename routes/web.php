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

Route::get('/Planters', function () {return Inertia::render('Planters/Index');})->middleware(['auth', 'verified'])->name('planters.index');
Route::get('/Planters/data', [PlanterController::class, 'get']);
Route::get('/Planters/{id}', [PlanterController::class, 'get']);
Route::get('/Planters/header', [PlanterController::class, 'header']);
Route::post('/Planters/create', [PlanterController::class, 'create']);
Route::put('/Planters/{id}', [PlanterController::class, 'update']);
Route::delete('/Planters/{id}', [PlanterController::class, 'destroy']);

# kulang pagli iya nga url (/planter /production) meg
Route::get('/Productions/data', [ProductionController::class, 'get']);
Route::get('/Productions/header', [ProductionController::class, 'header']);
Route::post('/Productions/create', [ProductionController::class, 'create']);

Route::get('/Employees/data', [EmployeeController::class, 'get']);
Route::get('/Employees/header', [EmployeeController::class, 'header']);
Route::post('/Employees/create', [EmployeeController::class, 'create']);
Route::get('/Employees/{id}/payroll', [EmployeeController::class, 'show_with_payroll']);
Route::get('/Employees/{id}/attendance', [EmployeeController::class, 'show_with_attendance']);
Route::get('/Employees/{id}/full', [EmployeeController::class, 'show_with_both']);
Route::put('/Employees/{id}', [EmployeeController::class, 'update']);
Route::delete('/Employees/{id}', [EmployeeController::class, 'destroy']);

Route::get('/Certifications/data', [CertificationController::class, 'get']);
Route::get('/Certifications/header', [CertificationController::class, 'header']);
Route::post('/Certifications/create', [CertificationController::class, 'create']);
Route::put('/Certifications/{id}', [CertificationController::class, 'update']);
Route::delete('/Certifications/{id}', [CertificationController::class, 'destroy']);

Route::get('/Attendances/data', [AttendanceController::class, 'get']);
Route::get('/Attendances/header', [AttendanceController::class, 'header']);
Route::post('/Attendances/create', [AttendanceController::class, 'create']);
Route::put('/Attendances/{id}', [AttendanceController::class, 'update']);
Route::delete('/Attendances/{id}', [AttendanceController::class, 'destroy']);

Route::get('/Payrolls/data', [PayrollController::class, 'get']);
Route::get('/Payrolls/header', [PayrollController::class, 'header']);
Route::post('/Payrolls/create', [PayrollController::class, 'create']);
Route::put('/Payrolls/{id}', [PayrollController::class, 'update']);
Route::delete('/Payrolls/{id}', [PayrollController::class, 'destroy']);

Route::get('/Employees', [EmployeeController::class, 'index'])->middleware(['auth', 'verified'])->name('employees.index');

require __DIR__.'/settings.php';
