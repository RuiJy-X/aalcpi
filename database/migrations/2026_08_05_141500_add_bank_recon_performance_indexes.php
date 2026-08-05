<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('internal_disbursements', function (Blueprint $table) {
            $table->index('date_issued');
            $table->index('disbursement_week');
            $table->index('is_duplicate');
            $table->index('status');
        });

        Schema::table('bank_statements', function (Blueprint $table) {
            $table->index('bank_date');
            $table->index('tdate');
            $table->index('is_duplicate');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('internal_disbursements', function (Blueprint $table) {
            $table->dropIndex(['date_issued']);
            $table->dropIndex(['disbursement_week']);
            $table->dropIndex(['is_duplicate']);
            $table->dropIndex(['status']);
        });

        Schema::table('bank_statements', function (Blueprint $table) {
            $table->dropIndex(['bank_date']);
            $table->dropIndex(['tdate']);
            $table->dropIndex(['is_duplicate']);
        });
    }
};
