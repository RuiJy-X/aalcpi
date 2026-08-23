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
     * Find an unmatched bank row for a given check number, preferring exact
     * amount matches (when $exactAmountOnly is true) and closest transaction
     * date to $referenceDate. Supports normalized check numbers (stripping leading zeros).
     */
    public static function findBankMatchFor(
        string $checkNo,
        float $checkAmount,
        ?string $referenceDate,
        bool $exactAmountOnly = true
    ): ?BankStatement {
        $cleanCheckNo = trim($checkNo);
        if ($cleanCheckNo === '') {
            return null;
        }

        $normalizedCheckNo = ltrim($cleanCheckNo, '0');
        $reference = $referenceDate ? Carbon::parse($referenceDate) : null;

        // Query candidate bank statement rows that are not yet linked to an internal disbursement
        $candidates = BankStatement::whereDoesntHave('internalDisbursement')
            ->where(function ($q) use ($cleanCheckNo, $normalizedCheckNo) {
                $q->where('checkno', $cleanCheckNo);
                if ($normalizedCheckNo !== '') {
                    $q->orWhere('checkno', $normalizedCheckNo);
                }
            })
            ->get()
            ->filter(function (BankStatement $bank) use ($cleanCheckNo, $normalizedCheckNo) {
                $bankCheckNo = trim((string) $bank->checkno);
                if ($bankCheckNo === '') {
                    return false;
                }
                $bankNormalized = ltrim($bankCheckNo, '0');

                return $bankCheckNo === $cleanCheckNo || ($normalizedCheckNo !== '' && $bankNormalized === $normalizedCheckNo);
            });

        if ($exactAmountOnly) {
            $candidates = $candidates->filter(function (BankStatement $bank) use ($checkAmount) {
                if ($bank->debit === null) {
                    return true;
                }

                return abs((float) $bank->debit - $checkAmount) < 0.01;
            });
        }

        return $candidates
            ->sortBy(function (BankStatement $bank) use ($reference) {
                if (! $reference || ! $bank->tdate) {
                    return 0;
                }

                return abs(Carbon::parse($bank->tdate)->diffInDays($reference));
            })
            ->first();
    }

    /**
     * Reconcile unmatched internal disbursements against available bank statements.
     * Executes in deterministic passes:
     * 1. Unlinks any prior non-exact (amount mismatch) pairings so exact matches take priority.
     * 2. Pass 1: Pairs all exact check number + exact amount matches across the database.
     * 3. Pass 2: Pairs remaining check number matches (amount mismatches).
     * This guarantees deterministic, order-independent reconciliation results regardless of import sequence.
     */
    public static function reconcileUnmatched(): void
    {
        // Step 0: Unlink any existing amount-mismatch pairings so Pass 1 exact matches take precedence.
        static::query()
            ->whereNotNull('bank_statement_id')
            ->with('bankStatement')
            ->each(function (self $disbursement) {
                if ($disbursement->bankStatement && $disbursement->bankStatement->debit !== null) {
                    $variance = abs((float) $disbursement->check_amount - (float) $disbursement->bankStatement->debit);
                    if ($variance >= 0.01) {
                        $disbursement->update(['bank_statement_id' => null]);
                    }
                }
            });

        // Pass 1: Match all exact check number + exact amount records
        static::query()
            ->whereNull('bank_statement_id')
            ->each(function (self $disbursement) {
                $match = static::findBankMatchFor(
                    (string) $disbursement->check_no,
                    (float) $disbursement->check_amount,
                    $disbursement->date_issued,
                    true
                );

                if ($match) {
                    $disbursement->update(['bank_statement_id' => $match->id]);
                }
            });

        // Pass 2: Match remaining check numbers where amount differs (Amount Mismatch)
        static::query()
            ->whereNull('bank_statement_id')
            ->each(function (self $disbursement) {
                $match = static::findBankMatchFor(
                    (string) $disbursement->check_no,
                    (float) $disbursement->check_amount,
                    $disbursement->date_issued,
                    false
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
