<?php
// database/migrations/2026_07_04_000001_add_is_duplicate_to_recon_tables.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('internal_disbursements', function (Blueprint $table) {
            $table->boolean('is_duplicate')->default(false)->after('check_no');
        });

        Schema::table('bank_statements', function (Blueprint $table) {
            $table->boolean('is_duplicate')->default(false)->after('checkno');
        });
    }

    public function down(): void
    {
        Schema::table('internal_disbursements', function (Blueprint $table) {
            $table->dropColumn('is_duplicate');
        });

        Schema::table('bank_statements', function (Blueprint $table) {
            $table->dropColumn('is_duplicate');
        });
    }
};