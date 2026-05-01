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
            $table->decimal('basic_pay', 16, 2);
            $table->decimal('overtime_pay', 16, 2);
            $table->decimal('gross_pay', 16, 2);
            $table->decimal('deductions', 16, 2);
            $table->decimal('net_pay', 16, 2);
            $table->string('status');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payrolls');
    }
};
