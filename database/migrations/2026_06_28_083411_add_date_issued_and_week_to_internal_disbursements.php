<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('internal_disbursements', function (Blueprint $table) {
            $table->date('date_issued')->nullable()->after('check_amount');
            $table->unsignedTinyInteger('disbursement_week')->nullable()->after('date_issued');
        });
    }

    public function down(): void
    {
        Schema::table('internal_disbursements', function (Blueprint $table) {
            $table->dropColumn(['date_issued', 'disbursement_week']);
        });
    }
};