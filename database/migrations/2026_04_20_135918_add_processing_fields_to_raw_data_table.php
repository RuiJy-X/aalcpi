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
        Schema::table('raw_data', function (Blueprint $table) {
            $table->string('processing_status')->default('pending')->after('planter_code')->index();
            $table->foreignId('production_id')->nullable()->after('processing_status')->constrained('productions')->nullOnDelete();
            $table->timestamp('processed_at')->nullable()->after('production_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('raw_data', function (Blueprint $table) {
            $table->dropConstrainedForeignId('production_id');
            $table->dropColumn(['processing_status', 'processed_at']);
        });
    }
};
