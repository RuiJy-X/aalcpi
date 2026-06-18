<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReconciliationWorkspace extends Model
{
    // Point directly to our database view
    protected $table = 'reconciliation_workspace';
    
    // Disable writes since views are read-only
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    protected $casts = [
        'transaction_date' => 'date',
        'internal_amount' => 'decimal:2',
        'bank_amount' => 'decimal:2',
    ];
}