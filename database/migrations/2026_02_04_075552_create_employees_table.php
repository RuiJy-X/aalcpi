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
            $table->string('position')->nullable();
            $table->string('employment_type')->nullable();
            $table->string('department')->nullable();
            $table->string('hourly_rate')->nullable();
            $table->decimal('base_salary', 12, 2)->nullable();
            $table->string('address')->nullable();
            $table->string('tin')->nullable();
            $table->string('contact_number')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        DB::statement('DROP TABLE IF EXISTS "employees" CASCADE');
    }
};
