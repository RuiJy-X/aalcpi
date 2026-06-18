<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;

class BankStatement extends Model
{
    protected $fillable = [
        'tdate', 'checkno', 'branch_description', 'partic', 'debit', 'credit', 'currency', 'running_balance'
    ];

    protected $casts = [
        'tdate' => 'date',
        'debit' => 'decimal:2',
        'credit' => 'decimal:2',
        'running_balance' => 'decimal:6',
    ];

    /**
     * Get the internal disbursement check associated with this bank transaction.
     */
    public function internalDisbursement(): HasOne
    {
        // Because the foreign key lives on the internal_disbursements table,
        // this side of the relationship uses hasOne.
        return $this->hasOne(InternalDisbursements::class, 'bank_statement_id');
    }
}