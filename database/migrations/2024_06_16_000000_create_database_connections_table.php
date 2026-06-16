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
        Schema::create('database_connections', function (Blueprint $table) {
            $table->id();
            $table->string('connection_name')->unique();
            $table->string('driver')->default('pgsql');
            $table->string('host');
            $table->unsignedInteger('port')->default(5432);
            $table->string('database');
            $table->string('username');
            $table->string('password');
            $table->string('charset')->default('utf8');
            $table->boolean('is_active')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('database_connections');
    }
};
