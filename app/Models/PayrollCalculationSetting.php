<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PayrollCalculationSetting extends Model
{
    protected $fillable = [
        'days_per_month',
        'hours_per_day',
    ];
}
