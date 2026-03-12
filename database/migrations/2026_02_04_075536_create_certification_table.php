<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{

    public function up(): void
    {
        Schema::create('certifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('planter_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('land_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('production_id')->nullable()->constrained()->nullOnDelete();
            $table->string('certification_type');
            $table->date('issue_date');
            $table->string('status');
            $table->timestamps();
        });
    }
 
    public function down(): void
    {
        DB::statement('DROP TABLE IF EXISTS "certifications" CASCADE');
    }
};
