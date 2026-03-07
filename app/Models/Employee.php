<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Employee extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 
        'position', 
        'employment_type', 
        'base_salary', 
        'hire_date'
    ];

    public function attendances() {
        return $this->hasMany(Attendance::class);
    }

    public function payrolls() {
        return $this->hasMany(Payroll::class);
    }
}
