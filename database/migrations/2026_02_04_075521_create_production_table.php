<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('productions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('planter_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('land_id')->nullable()->constrained()->nullOnDelete();
            $table->string('trans_code')->unique();
            $table->string('planter_code');
            $table->string('land_code');
            $table->integer('production_year');
            $table->string('production_month');
            $table->decimal('gross_cw', 12, 2);
            $table->decimal('net_cw', 12, 2);
            $table->integer('trucks');
            $table->decimal('theoretical_lkg', 12, 2);
            $table->decimal('actual_lkg', 12, 2);
            $table->decimal('pshr_net_lkg', 12, 2);
            $table->decimal('pdpa_lkg', 12, 2);
            $table->decimal('association_dues_lkg', 12, 2);
            $table->decimal('actual_mol', 12, 2);
            $table->decimal('pshr_net_mol', 12, 2);
            $table->decimal('pdpa_mol', 12, 2);
            $table->decimal('association_dues_mol', 12, 2);
            $table->boolean('transloading')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        DB::statement('DROP TABLE IF EXISTS "productions" CASCADE');
    }
};
