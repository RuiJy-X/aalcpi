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
        Schema::create('quedans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('production_id')->unique()->constrained('productions')->cascadeOnDelete();
            $table->string('serial_number')->nullable()->unique();
            $table->enum('status', ['pending', 'vaulted', 'pledged', 'released'])->default('pending');
            $table->text('remarks')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quedans');
    }
};
