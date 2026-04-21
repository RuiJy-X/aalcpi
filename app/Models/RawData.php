<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RawData extends Model
{
    use HasFactory;

    public const STATUS_PENDING = 'pending';
    public const STATUS_PROCESSED = 'processed';

    protected $table = 'raw_data';

    protected $fillable = [
        'crop_year',
        'date',
        'planter_code',
        'processing_status',
        'production_id',
        'processed_at',
        'gross_cw',
        'net_cw',
        'trucks',
        'theoretical_lkg',
        'actual_lkg',
        'calculated_sugar',
        'trash',
        'Lkg_per_TC',
    ];

    protected $casts = [
        'date' => 'date',
        'processed_at' => 'datetime',
    ];

    public function planter(): BelongsTo
    {
        return $this->belongsTo(Planter::class, 'planter_code', 'planter_code');
    }

    public function production(): BelongsTo
    {
        return $this->belongsTo(Production::class);
    }
}
