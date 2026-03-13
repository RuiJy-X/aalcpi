<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('planters', function (Blueprint $table) {
            $table->id();
            $table->string('planter_code')->unique();
            $table->string('name');
            $table->text('address')->nullable();
            $table->string('contact_number')->nullable()->unique();
            $table->string('tin_number')->nullable()->unique();
            $table->date('registration_date');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        DB::statement('DROP TABLE IF EXISTS "planters" CASCADE');
    }
};
