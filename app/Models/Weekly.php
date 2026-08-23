<?php

namespace App\Models;

use Database\Factories\WeeklyFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Weekly extends Model
{
    /** @use HasFactory<WeeklyFactory> */
    use HasFactory;

    protected $fillable = [
        'crop_year',
        'week',
        'planter_name',
        'planter_code',
        'segment',
        'page',
        'file_location',
        'import_job_id',
    ];
}
