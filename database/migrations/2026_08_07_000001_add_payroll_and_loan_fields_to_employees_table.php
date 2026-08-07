<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->decimal('daily_rate', 12, 2)->default(0.00)->after('hourly_rate');
            $table->string('sss_no')->nullable()->after('tin');
            $table->string('pagibig_no')->nullable()->after('sss_no');
            $table->string('philhealth_no')->nullable()->after('pagibig_no');

            // Constant Loan Deductions
            $table->decimal('sss_loan', 12, 2)->default(0.00)->after('contact_number');
            $table->decimal('pagibig_loan', 12, 2)->default(0.00)->after('sss_loan');
            $table->decimal('emergency_loan', 12, 2)->default(0.00)->after('pagibig_loan');

            // Statutory & Tax Contribution Settings
            $table->decimal('pagibig_contribution', 12, 2)->default(200.00)->after('emergency_loan');
            $table->decimal('sss_contribution', 12, 2)->nullable()->after('pagibig_contribution');
            $table->decimal('philhealth_contribution', 12, 2)->nullable()->after('sss_contribution');
            $table->decimal('withholding_tax', 12, 2)->default(0.00)->after('philhealth_contribution');
        });
    }

    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn([
                'daily_rate',
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
            ]);
        });
    }
};
