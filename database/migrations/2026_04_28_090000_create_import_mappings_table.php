<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('import_mappings', function (Blueprint $table) {
            $table->id();
            $table->string('import_type', 40);
            $table->string('header_signature', 64);
            $table->json('headers');
            $table->json('mapping');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['import_type', 'header_signature']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('import_mappings');
    }
};
