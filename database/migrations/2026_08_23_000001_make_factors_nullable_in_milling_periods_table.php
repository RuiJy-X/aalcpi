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
        Schema::table('milling_periods', function (Blueprint $table) {
            $table->decimal('sugar_factor', 20, 16)->default(1)->nullable()->change();
            $table->decimal('mol_factor', 20, 16)->default(0)->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('milling_periods', function (Blueprint $table) {
            $table->decimal('sugar_factor', 20, 16)->default(null)->nullable(false)->change();
            $table->decimal('mol_factor', 20, 16)->default(null)->nullable(false)->change();
        });
    }
};
