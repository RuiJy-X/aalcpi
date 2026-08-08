<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Employee extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_code',
        'name',
        'position',
        'daily_rate',
        'base_salary',
        'hourly_rate',
        'address',
        'contact_number',
        'tin',
        'sss_no',
        'pagibig_no',
        'philhealth_no',
        'sss_loan',
        'pagibig_loan',
        'emergency_loan',
        'pagibig_contribution',
        'sss_contribution',
        'philhealth_contribution',
        'withholding_tax',
        'holidays',
    ];

    protected $casts = [
        'daily_rate' => 'decimal:2',
        'base_salary' => 'decimal:2',
        'hourly_rate' => 'decimal:2',
        'sss_loan' => 'decimal:2',
        'pagibig_loan' => 'decimal:2',
        'emergency_loan' => 'decimal:2',
        'pagibig_contribution' => 'decimal:2',
        'sss_contribution' => 'decimal:2',
        'philhealth_contribution' => 'decimal:2',
        'withholding_tax' => 'decimal:2',
    ];

    protected $appends = [
        'cash_advance_balance',
        'pending_advancement_payout',
    ];

    public function getCashAdvanceBalanceAttribute(): float
    {
        return (float) Advancement::where('employee_id', $this->id)
            ->whereIn('status', ['pending_payout', 'paid_out', 'partially_deducted'])
            ->sum('remaining_balance');
    }

    public function getPendingAdvancementPayoutAttribute(): float
    {
        return (float) Advancement::where('employee_id', $this->id)
            ->where('status', 'pending_payout')
            ->sum('amount');
    }

    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class);
    }

    public function payrolls(): HasMany
    {
        return $this->hasMany(Payroll::class);
    }

    public function advancements(): HasMany
    {
        return $this->hasMany(Advancement::class);
    }

    protected static function booted(): void
    {
        static::updated(function (Employee $employee) {
            self::deleteDraftsForEmployee($employee->id);
        });

        static::deleted(function (Employee $employee) {
            self::deleteDraftsForEmployee($employee->id);
        });
    }

    public static function deleteDraftsForEmployee(int $employeeId): void
    {
        $draftPayrolls = Payroll::where('employee_id', $employeeId)
            ->where('status', 'draft')
            ->get();

        foreach ($draftPayrolls as $draft) {
            Advancement::where('payout_payroll_id', $draft->id)
                ->orWhere('deduction_payroll_id', $draft->id)
                ->get()
                ->each(fn(Advancement $adv) => $adv->releaseFromPayroll($draft->id));

            $draft->delete();
        }
    }
}
