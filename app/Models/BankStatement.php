<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;

class BankStatement extends Model
{
    protected $fillable = [
        'tdate', 'checkno', 'branch_description', 'partic', 'debit', 'credit',
        'currency', 'running_balance', 'import_job_id', 'bank_date', 'is_duplicate',
    ];

    protected $casts = [
        'tdate' => 'date',
        'debit' => 'decimal:2',
        'credit' => 'decimal:2',
        'running_balance' => 'decimal:6',
        'bank_date' => 'date',
        'is_duplicate' => 'boolean',
    ];

    public function internalDisbursement(): HasOne
    {
        return $this->hasOne(InternalDisbursements::class, 'bank_statement_id');
    }

    /**
     * Flag every row whose checkno is shared by more than one row as a
     * duplicate, clearing the flag on everything else.
     */
    public static function refreshDuplicateFlags(): void
    {
        static::query()->where('is_duplicate', true)->update(['is_duplicate' => false]);

        $duplicateCheckNos = static::query()
            ->whereNotNull('checkno')
            ->where('checkno', '!=', '')
            ->groupBy('checkno')
            ->havingRaw('COUNT(*) > 1')
            ->pluck('checkno');

        if ($duplicateCheckNos->isNotEmpty()) {
            static::query()
                ->whereIn('checkno', $duplicateCheckNos)
                ->update(['is_duplicate' => true]);
        }
    }
}