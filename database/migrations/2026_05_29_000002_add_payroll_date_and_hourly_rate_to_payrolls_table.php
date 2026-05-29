<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payrolls', function (Blueprint $table) {
            $table->date('payroll_date')->nullable()->after('period_end');
            $table->decimal('hourly_rate', 16, 2)->nullable()->after('hours_worked');
        });
    }

    public function down(): void
    {
        Schema::table('payrolls', function (Blueprint $table) {
            $table->dropColumn(['payroll_date', 'hourly_rate']);
        });
    }
};
