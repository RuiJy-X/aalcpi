<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AdvancementDeduction extends Model
{
    use HasFactory;

    protected $fillable = [
        'advancement_id',
        'payroll_id',
        'amount_deducted',
    ];

    protected $casts = [
        'amount_deducted' => 'decimal:2',
    ];

    public function advancement(): BelongsTo
    {
        return $this->belongsTo(Advancement::class);
    }

    public function payroll(): BelongsTo
    {
        return $this->belongsTo(Payroll::class);
    }
}
