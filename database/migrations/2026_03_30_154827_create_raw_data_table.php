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
            $table->string('gross_cw');
            $table->string('net_cw');
            $table->string('trucks');
            $table->string('theoretical_lkg');
            $table->string('actual_lkg');
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
