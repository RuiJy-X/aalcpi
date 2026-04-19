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
        Schema::create('raw_data', function (Blueprint $table) {
            $table->id();
            $table->timestamps();
            $table->string('crop_year');
            $table->date('date');
            $table->string('planter_code');
            $table->decimal('gross_cw', 10, 3);
            $table->decimal('net_cw', 10, 3);
            $table->decimal('trucks', 10, 3);
            $table->decimal('theoretical_lkg', 10, 3);
            $table->decimal('actual_lkg', 10, 3);
            $table->decimal('calculated_sugar', 10, 3); //example: 10.65
            $table->decimal('trash', 6, 3); //example: 3.00
            $table->decimal('Lkg_per_TC', 6, 3); //example: 1.325

            $table->unique(['crop_year', 'date', 'planter_code']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('raw_data');
    }
};
