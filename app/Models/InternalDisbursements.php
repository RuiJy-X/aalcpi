<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InternalDisbursements extends Model
{
    protected $table = 'internal_disbursements';
    protected $fillable = [
        'audit_no', 'payee_name', 'check_no', 'check_amount', 'date_return', 'bank_statement_id', 'import_job_id'
    ];

    protected $casts = [
        'date_return' => 'date',
        'check_amount' => 'decimal:2',
    ];

    public function bankStatement(): BelongsTo
    {
        // Laravel automatically looks for a column named 'bank_statement_id' 
        // on this table and matches it to the 'id' of the BankStatement model.
        return $this->belongsTo(BankStatement::class);
    }

    // App\Models\InternalDisbursements
    public static function reconcileUnmatched(): void
    {
        static::query()
            ->whereNull('bank_statement_id')
            ->each(function (self $disbursement) {
                $match = BankStatement::where('checkno', $disbursement->check_no)
                    ->whereDoesntHave('internalDisbursement')
                    ->first();

                if ($match) {
                    $disbursement->update(['bank_statement_id' => $match->id]);
                }
        });
    }
}
