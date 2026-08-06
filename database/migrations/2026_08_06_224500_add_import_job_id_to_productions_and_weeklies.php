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
        Schema::table('productions', function (Blueprint $table) {
            if (! Schema::hasColumn('productions', 'import_job_id')) {
                $table->foreignId('import_job_id')->nullable()->after('id')->constrained('import_jobs')->nullOnDelete();
            }
        });

        Schema::table('weeklies', function (Blueprint $table) {
            if (! Schema::hasColumn('weeklies', 'import_job_id')) {
                $table->foreignId('import_job_id')->nullable()->after('id')->constrained('import_jobs')->nullOnDelete();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('productions', function (Blueprint $table) {
            if (Schema::hasColumn('productions', 'import_job_id')) {
                $table->dropConstrainedForeignId('import_job_id');
            }
        });

        Schema::table('weeklies', function (Blueprint $table) {
            if (Schema::hasColumn('weeklies', 'import_job_id')) {
                $table->dropConstrainedForeignId('import_job_id');
            }
        });
    }
};
