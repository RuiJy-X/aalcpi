<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payrolls', function (Blueprint $table) {
            $table->decimal('cash_advance_payout', 12, 2)->default(0.00)->after('gross_pay');
            $table->decimal('cash_advance_deduction', 12, 2)->default(0.00)->after('cash_advance_payout');
            $table->decimal('sss_loan', 12, 2)->default(0.00)->after('cash_advance_deduction');
            $table->decimal('pagibig_loan', 12, 2)->default(0.00)->after('sss_loan');
            $table->decimal('emergency_loan', 12, 2)->default(0.00)->after('pagibig_loan');
        });
    }

    public function down(): void
    {
        Schema::table('payrolls', function (Blueprint $table) {
            $table->dropColumn([
                'cash_advance_payout',
                'cash_advance_deduction',
                'sss_loan',
                'pagibig_loan',
                'emergency_loan',
            ]);
        });
    }
};
