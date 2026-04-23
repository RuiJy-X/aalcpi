<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('productions', function (Blueprint $table) {
            $table->foreignId('milling_period_id')
                ->nullable()
                ->after('hacienda_id')
                ->constrained('milling_periods')
                ->nullOnDelete();
            $table->string('financial_status', 40)
                ->default('pending_price')
                ->after('transloading');
            $table->decimal('distribution_total', 16, 4)
                ->nullable()
                ->after('financial_status');
            $table->decimal('molasses_total', 16, 4)
                ->nullable()
                ->after('distribution_total');
            $table->timestamp('financial_calculated_at')
                ->nullable()
                ->after('molasses_total');
            $table->timestamp('financial_reviewed_at')
                ->nullable()
                ->after('financial_calculated_at');
            $table->foreignId('financial_reviewed_by')
                ->nullable()
                ->after('financial_reviewed_at')
                ->constrained('users')
                ->nullOnDelete();
            $table->text('financial_rejection_reason')
                ->nullable()
                ->after('financial_reviewed_by');

            $table->index(['financial_status']);
            $table->index(['milling_period_id', 'financial_status']);
        });

        DB::table('productions')->orderBy('id')->chunkById(200, function ($productions): void {
            foreach ($productions as $production) {
                $millingPeriod = null;

                if (!empty($production->production_date)) {
                    $millingPeriod = DB::table('milling_periods')
                        ->whereDate('start_date', '<=', $production->production_date)
                        ->whereDate('end_date', '>=', $production->production_date)
                        ->orderBy('start_date')
                        ->first();
                }

                $updatePayload = [
                    'milling_period_id' => $millingPeriod?->id,
                    'financial_status' => 'pending_price',
                ];

                if (
                    $millingPeriod !== null
                    && $millingPeriod->sugar_price !== null
                    && $millingPeriod->mol_price !== null
                ) {
                    $distributionTotal = round(
                        (float) $production->pshr_net_lkg
                        * (float) $millingPeriod->sugar_price
                        * (float) $millingPeriod->sugar_factor,
                        4,
                    );

                    $molassesTotal = round(
                        (float) $production->pshr_net_mol
                        * (float) $millingPeriod->mol_price
                        * (float) $millingPeriod->mol_factor,
                        4,
                    );

                    $updatePayload['financial_status'] = 'calculated_pending_review';
                    $updatePayload['distribution_total'] = $distributionTotal;
                    $updatePayload['molasses_total'] = $molassesTotal;
                    $updatePayload['financial_calculated_at'] = now();
                }

                DB::table('productions')
                    ->where('id', $production->id)
                    ->update($updatePayload);
            }
        });
    }

    public function down(): void
    {
        Schema::table('productions', function (Blueprint $table) {
            $table->dropForeign(['milling_period_id']);
            $table->dropForeign(['financial_reviewed_by']);
            $table->dropIndex(['financial_status']);
            $table->dropIndex(['milling_period_id', 'financial_status']);

            $table->dropColumn([
                'milling_period_id',
                'financial_status',
                'distribution_total',
                'molasses_total',
                'financial_calculated_at',
                'financial_reviewed_at',
                'financial_reviewed_by',
                'financial_rejection_reason',
            ]);
        });
    }
};
