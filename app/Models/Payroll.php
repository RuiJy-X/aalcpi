<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

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
        'holidays',
        'gross_pay',
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
        'holidays' => 'integer',
        'gross_pay' => 'decimal:2',
        'deductions' => 'decimal:2',
        'net_pay' => 'decimal:2',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}
