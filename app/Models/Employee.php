<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Employee extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_code',
        'name',
        'position',
        'daily_rate',
        'base_salary',
        'hourly_rate',
        'address',
        'contact_number',
        'tin',
        'sss_no',
        'pagibig_no',
        'philhealth_no',
        'sss_loan',
        'pagibig_loan',
        'emergency_loan',
        'pagibig_contribution',
        'sss_contribution',
        'philhealth_contribution',
        'withholding_tax',
    ];

    protected $casts = [
        'daily_rate' => 'decimal:2',
        'base_salary' => 'decimal:2',
        'hourly_rate' => 'decimal:2',
        'sss_loan' => 'decimal:2',
        'pagibig_loan' => 'decimal:2',
        'emergency_loan' => 'decimal:2',
        'pagibig_contribution' => 'decimal:2',
        'sss_contribution' => 'decimal:2',
        'philhealth_contribution' => 'decimal:2',
        'withholding_tax' => 'decimal:2',
    ];

    public function attendances() {
        return $this->hasMany(Attendance::class);
    }

    public function payrolls() {
        return $this->hasMany(Payroll::class);
    }
}
