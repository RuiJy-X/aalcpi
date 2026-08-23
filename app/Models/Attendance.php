<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Attendance extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'date',
        'week',
        'time_in',
        'time_out',
        'times',
        'working_time',
        'hours_worked',
        'overtime_hours',
        'status',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}
