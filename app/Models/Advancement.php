<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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

        if ($this->deduction_payroll_id === $payrollId) {
            $data['deduction_payroll_id'] = null;
            $data['remaining_balance'] = $this->amount;
            $data['status'] = !empty($this->payout_payroll_id) && $this->payout_payroll_id !== $payrollId ? 'paid_out' : 'pending_payout';
            $updated = true;
        }

        if ($updated) {
            $this->update($data);
        }
    }
}
