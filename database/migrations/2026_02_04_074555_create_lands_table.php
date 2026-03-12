<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lands', function (Blueprint $table) {
            $table->id();
            $table->foreignId('planter_id')->constrained('planters')->onDelete('cascade');
            $table->string('name');
            $table->text('address');
            $table->decimal('area_hectares', 8, 2);
            $table->integer('distance_from_urc');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        DB::statement('DROP TABLE IF EXISTS "lands" CASCADE');
    }
};
