<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('internal_disbursements', function (Blueprint $table) {
            $table->foreignId('import_job_id')->nullable()->after('id')
                ->constrained('import_jobs')->nullOnDelete();
        });

        Schema::table('bank_statements', function (Blueprint $table) {
            $table->foreignId('import_job_id')->nullable()->after('id')
                ->constrained('import_jobs')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('internal_disbursements', function (Blueprint $table) {
            $table->dropConstrainedForeignId('import_job_id');
        });

        Schema::table('bank_statements', function (Blueprint $table) {
            $table->dropConstrainedForeignId('import_job_id');
        });
    }
};