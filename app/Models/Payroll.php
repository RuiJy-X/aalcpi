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
        'base_salary', 
        'total_overtime_hours', 
        'total_deductions', 
        'gross_pay', 
        'net_pay', 
        'status'
    ];

    public function employee() {
        return $this->belongsTo(Employee::class);
    }
}
