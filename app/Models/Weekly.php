<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Weekly extends Model
{
    /** @use HasFactory<\Database\Factories\WeeklyFactory> */
    use HasFactory;

    protected $fillable = [
        'crop_year',
        'week',
        'planter_name',
        'planter_code',
        'segment',
        'page',
        'file_location'
    ];
}
