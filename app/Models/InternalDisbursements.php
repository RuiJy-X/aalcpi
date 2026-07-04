<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InternalDisbursements extends Model
{
    protected $table = 'internal_disbursements';
    protected $fillable = [
        'audit_no', 'payee_name', 'check_no', 'check_amount', 'date_return',
        'bank_statement_id', 'import_job_id', 'date_issued', 'disbursement_week',
        'is_duplicate',
    ];

    protected $casts = [
        'date_return' => 'date',
        'check_amount' => 'decimal:2',
        'is_duplicate' => 'boolean',
    ];

    public function bankStatement(): BelongsTo
    {
        return $this->belongsTo(BankStatement::class);
    }

    /**
     * Find an unmatched bank row for a given check number, but only accept
     * a candidate whose debit amount actually agrees with the check amount
     * (within a cent, to allow for float rounding), preferring the
     * candidate whose transaction date is closest to $referenceDate. Check
     * numbers get reused across weeks/months, so matching on checkno alone
     * risks pairing a disbursement with an unrelated bank transaction from
     * a different period.
     */
    public static function findBankMatchFor(string $checkNo, float $checkAmount, ?string $referenceDate): ?BankStatement
    {
        if ($checkNo === '') {
            return null;
        }

        $reference = $referenceDate ? Carbon::parse($referenceDate) : null;

        return BankStatement::where('checkno', $checkNo)
            ->whereDoesntHave('internalDisbursement')
            ->get()
            ->filter(function (BankStatement $bank) use ($checkAmount) {
                if ($bank->debit === null) {
                    return true;
                }
                return abs((float) $bank->debit - $checkAmount) < 0.01;
            })
            ->sortBy(function (BankStatement $bank) use ($reference) {
                if (!$reference || !$bank->tdate) {
                    return 0;
                }
                return abs(Carbon::parse($bank->tdate)->diffInDays($reference));
            })
            ->first();
    }

    public static function reconcileUnmatched(): void
    {
        static::query()
            ->whereNull('bank_statement_id')
            ->each(function (self $disbursement) {
                $match = static::findBankMatchFor(
                    (string) $disbursement->check_no,
                    (float) $disbursement->check_amount,
                    $disbursement->date_issued,
                );

                if ($match) {
                    $disbursement->update(['bank_statement_id' => $match->id]);
                }
            });
    }

    /**
     * Flag every row whose check_no is shared by more than one row as
     * a duplicate, and clear the flag on everything else. Run after every
     * import so the table always reflects the current state of the data,
     * not just what happened in the most recent batch.
     */
    public static function refreshDuplicateFlags(): void
    {
        static::query()->where('is_duplicate', true)->update(['is_duplicate' => false]);

        $duplicateCheckNos = static::query()
            ->whereNotNull('check_no')
            ->where('check_no', '!=', '')
            ->groupBy('check_no')
            ->havingRaw('COUNT(*) > 1')
            ->pluck('check_no');

        if ($duplicateCheckNos->isNotEmpty()) {
            static::query()
                ->whereIn('check_no', $duplicateCheckNos)
                ->update(['is_duplicate' => true]);
        }
    }
}