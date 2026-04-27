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
        Schema::create('weeklies', function (Blueprint $table) {
            $table->id();
            $table->timestamps();
            $table->string('crop_year');
            $table->string('week');
            $table->string('planter_name');
            $table->string('planter_code');
            $table->string('segment');
            $table->string('page');
            $table->string('file_location');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('weeklies');
    }
};
