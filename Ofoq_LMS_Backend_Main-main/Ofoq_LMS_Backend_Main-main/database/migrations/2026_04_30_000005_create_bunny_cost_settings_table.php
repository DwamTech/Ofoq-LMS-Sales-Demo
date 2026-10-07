<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('bunny_cost_settings')) {
            return;
        }

        Schema::create('bunny_cost_settings', function (Blueprint $table) {
            $table->id();
            $table->decimal('bandwidth_cost_per_gb', 12, 6)->nullable();
            $table->decimal('storage_cost_per_gb_month', 12, 6)->nullable();
            $table->decimal('fixed_monthly_cost', 12, 6)->default(0);
            $table->string('currency', 3)->default('USD');
            $table->date('effective_from');
            $table->boolean('is_active')->default(true);
            $table->string('data_source')->default('admin_configured');
            $table->string('accuracy_level')->default('estimated');
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['is_active', 'effective_from']);
        });
    }

    public function down(): void
    {
        // Intentionally keep reporting tables to avoid data loss in production rollbacks.
    }
};
