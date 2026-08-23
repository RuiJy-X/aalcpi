<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payroll extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'period_start',
        'period_end',
        'payroll_date',
        'days_worked',
        'total_days',
        'total_hours',
        'hours_worked',
        'hourly_rate',
        'basic_pay',
        'overtime_pay',
        'overtime_hours',
        'holidays',
        'holiday_pay',
        'gross_pay',
        'cash_advance_payout',
        'cash_advance_deduction',
        'sss_loan',
        'pagibig_loan',
        'emergency_loan',
        'deductions',
        'net_pay',
        'status',
    ];

    protected $casts = [
        'period_start' => 'date',
        'period_end' => 'date',
        'payroll_date' => 'date',
        'hourly_rate' => 'decimal:2',
        'basic_pay' => 'decimal:2',
        'overtime_pay' => 'decimal:2',
        'overtime_hours' => 'decimal:2',
        'holidays' => 'integer',
        'holiday_pay' => 'decimal:2',
        'gross_pay' => 'decimal:2',
        'cash_advance_payout' => 'decimal:2',
        'cash_advance_deduction' => 'decimal:2',
        'sss_loan' => 'decimal:2',
        'pagibig_loan' => 'decimal:2',
        'emergency_loan' => 'decimal:2',
        'deductions' => 'decimal:2',
        'net_pay' => 'decimal:2',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}
