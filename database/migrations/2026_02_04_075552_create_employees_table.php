<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{

    public function up(): void
    {
        Schema::create('employees', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('position');
            $table->string('employment_type'); // Regular, Seasonal
            $table->decimal('base_salary', 12, 2);
            $table->date('hire_date');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        DB::statement('DROP TABLE IF EXISTS "employees" CASCADE');
    }
};
