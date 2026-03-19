<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Add the role column (manager, cert_officer, employee)
            $table->string('role')->default('employee')->after('email');
            
            // Add the employee link (so they can see their own data later)
            $table->foreignId('employee_id')->nullable()->after('role')->constrained()->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['role', 'employee_id']);
        });
    }
};
