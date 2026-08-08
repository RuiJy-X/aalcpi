<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('advancements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->onDelete('cascade');
            $table->decimal('amount', 12, 2);
            $table->decimal('remaining_balance', 12, 2);
            $table->date('advancement_date');
            $table->enum('status', ['pending_payout', 'paid_out', 'partially_deducted', 'deducted', 'cancelled'])->default('pending_payout');
            $table->foreignId('payout_payroll_id')->nullable()->constrained('payrolls')->onDelete('set null');
            $table->foreignId('deduction_payroll_id')->nullable()->constrained('payrolls')->onDelete('set null');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('advancements');
    }
};
