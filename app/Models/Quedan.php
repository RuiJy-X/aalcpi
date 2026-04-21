<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Quedan extends Model
{
    public const STATUS_PENDING = 'pending';
    public const STATUS_VAULTED = 'vaulted';
    public const STATUS_PLEDGED = 'pledged';
    public const STATUS_RELEASED = 'released';

    protected $fillable = [
        'production_id',
        'serial_number',
        'status',
        'remarks',
    ];

    public function production(): BelongsTo
    {
        return $this->belongsTo(Production::class);
    }
}
