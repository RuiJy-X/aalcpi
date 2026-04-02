<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class RawData extends Model
{   
    use HasFactory;
    
    protected $table = 'raw_data';

    protected $fillable = [
        'crop_year',
        'date',
        'planter_code',
        'gross_cw',
        'net_cw',
        'trucks',
        'theoretical_lkg',
        'actual_lkg',
    ];
}
