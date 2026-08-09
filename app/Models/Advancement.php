<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Advancement extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'amount',
        'remaining_balance',
        'advancement_date',
        'status',
        'payout_payroll_id',
        'deduction_payroll_id',
        'notes',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'remaining_balance' => 'decimal:2',
        'advancement_date' => 'date',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function payoutPayroll(): BelongsTo
    {
        return $this->belongsTo(Payroll::class, 'payout_payroll_id');
    }

    public function deductionPayroll(): BelongsTo
    {
        return $this->belongsTo(Payroll::class, 'deduction_payroll_id');
    }

    public function deductions(): HasMany
    {
        return $this->hasMany(AdvancementDeduction::class);
    }

    /**
     * Safely release payroll links and restore remaining balance if linked payroll is deleted or reverted.
     */
    public function releaseFromPayroll(int $payrollId): void
    {
        $updated = false;
        $data = [];

        if ($this->payout_payroll_id === $payrollId) {
            $data['payout_payroll_id'] = null;
            $data['status'] = 'pending_payout';
            $updated = true;
        }

        // Check if there is an exact ledger deduction recorded for this payroll
        $deductionRecord = AdvancementDeduction::where('advancement_id', $this->id)
            ->where('payroll_id', $payrollId)
            ->first();

        if ($deductionRecord) {
            $deductedAmount = (float) $deductionRecord->amount_deducted;
            $newRemaining = min((float) $this->amount, round((float) $this->remaining_balance + $deductedAmount, 2));

            $data['remaining_balance'] = $newRemaining;
            $data['deduction_payroll_id'] = null;

            if ($newRemaining >= (float) $this->amount) {
                $data['status'] = !empty($this->payout_payroll_id) && $this->payout_payroll_id !== $payrollId ? 'paid_out' : 'pending_payout';
            } else {
                $data['status'] = 'partially_deducted';
            }

            $deductionRecord->delete();
            $updated = true;
        } elseif ($this->deduction_payroll_id === $payrollId) {
            $data['deduction_payroll_id'] = null;
            $data['status'] = !empty($this->payout_payroll_id) && $this->payout_payroll_id !== $payrollId ? 'paid_out' : 'pending_payout';
            $updated = true;
        }

        if ($updated) {
            $this->update($data);
        }
    }
}
