<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

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
    ];

    public function employee() {
        return $this->belongsTo(Employee::class);
    }
}
