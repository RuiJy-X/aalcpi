<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('advancement_deductions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('advancement_id')->constrained('advancements')->onDelete('cascade');
            $table->foreignId('payroll_id')->constrained('payrolls')->onDelete('cascade');
            $table->decimal('amount_deducted', 12, 2);
            $table->timestamps();

            $table->unique(['advancement_id', 'payroll_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('advancement_deductions');
    }
};
