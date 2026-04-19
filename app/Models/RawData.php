<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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
        'calculated_sugar',
        'trash',
        'Lkg_per_TC',
    ];

    public function planter(): BelongsTo
    {
        return $this->belongsTo(Planter::class, 'planter_code', 'planter_code');
    }
}
