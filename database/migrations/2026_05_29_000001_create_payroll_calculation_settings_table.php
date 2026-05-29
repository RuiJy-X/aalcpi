<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payroll_calculation_settings', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('days_per_month')->default(24);
            $table->decimal('hours_per_day', 5, 2)->default(8);
            $table->timestamps();
        });

        DB::table('payroll_calculation_settings')->insert([
            'days_per_month' => 24,
            'hours_per_day' => 8,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('payroll_calculation_settings');
    }
};
