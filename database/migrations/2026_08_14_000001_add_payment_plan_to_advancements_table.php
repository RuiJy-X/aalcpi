<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('advancements', function (Blueprint $table) {
            $table->string('repayment_term_type', 30)->default('full')->after('advancement_date');
            $table->integer('repayment_terms')->nullable()->after('repayment_term_type');
            $table->decimal('installment_amount', 12, 2)->nullable()->after('repayment_terms');
        });
    }

    public function down(): void
    {
        Schema::table('advancements', function (Blueprint $table) {
            $table->dropColumn(['repayment_term_type', 'repayment_terms', 'installment_amount']);
        });
    }
};
