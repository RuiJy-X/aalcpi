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
        Schema::create('internal_disbursements', function (Blueprint $table) {
            $table->id();
            $table->timestamps();
            $table->string('audit_no')->nullable()->index();
            $table->string('payee_name');
            $table->string('check_no')->index();
            $table->decimal('check_amount',20,2);
            $table->date('date_return')->nullable();
            $table->string('status')->default('Outstanding'); // Outstanding, Matched, Amount Mismatch  
            $table->foreignId('bank_statement_id')->nullable()->constrained('bank_statements')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('internal_disbursements');
    }
};
