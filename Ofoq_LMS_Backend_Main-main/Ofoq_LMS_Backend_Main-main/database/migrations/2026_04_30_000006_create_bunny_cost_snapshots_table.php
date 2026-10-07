<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('bunny_cost_snapshots')) {
            return;
        }

        Schema::create('bunny_cost_snapshots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bunny_cost_setting_id')->nullable()->constrained()->nullOnDelete();
            $table->dateTime('period_start')->nullable();
            $table->dateTime('period_end')->nullable();
            $table->unsignedBigInteger('storage_bytes')->nullable();
            $table->unsignedBigInteger('bandwidth_bytes')->nullable();
            $table->decimal('storage_cost', 12, 6)->nullable();
            $table->decimal('bandwidth_cost', 12, 6)->nullable();
            $table->decimal('fixed_cost', 12, 6)->nullable();
            $table->decimal('total_estimated_cost', 12, 6)->nullable();
            $table->string('currency', 3)->nullable();
            $table->string('cost_status')->default('missing_settings');
            $table->string('data_source')->default('bunny_cost_calculator');
            $table->string('accuracy_level')->default('estimated');
            $table->json('calculation_basis')->nullable();
            $table->json('unavailable_metrics')->nullable();
            $table->timestamp('last_synced_at')->nullable();
            $table->timestamps();

            $table->index(['period_start', 'period_end']);
            $table->index('cost_status');
        });
    }

    public function down(): void
    {
        // Intentionally keep reporting tables to avoid data loss in production rollbacks.
    }
};
