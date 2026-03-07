<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{

    public function up(): void
    {
        Schema::create('payrolls', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->onDelete('cascade');
            
            $table->date('period_start');
            $table->date('period_end');
            $table->decimal('base_salary', 12, 2);
            $table->decimal('total_overtime_hours', 8, 2)->default(0);
            $table->decimal('total_deductions', 12, 2)->default(0);
            $table->decimal('gross_pay', 12, 2);
            $table->decimal('net_pay', 12, 2);
            $table->string('status')->default('draft'); // draft, released, paid
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payrolls');
    }
};
