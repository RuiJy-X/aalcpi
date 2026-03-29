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
        Schema::create('milling_periods', function (Blueprint $table) {
            $table->id();
            $table->timestamps();
            $table->integer('week_no');
            $table->string('crop_year');
            $table->unique(['week_no', 'crop_year']);
            $table->date('start_date');
            $table->date('end_date');
            $table->decimal('sugar_factor', 20,16);
            $table->decimal('mol_factor', 20,16);
            $table->decimal('sugar_price', 20,4)->nullable();
            $table->decimal('mol_price', 20,4)->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('milling_periods');
    }
};
