<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('productions', function (Blueprint $table) {
            $table->decimal('composite_sugar_price', 12, 4)->nullable();
            $table->decimal('composite_molasses_price', 12, 4)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('productions', function (Blueprint $table) {
            $table->dropColumn(['composite_sugar_price', 'composite_molasses_price']);
        });
    }
};
