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
            $table->decimal('planter_lkg_money', 16, 4)->nullable()->after('molasses_total');
            $table->decimal('pdpa_lkg_money', 16, 4)->nullable()->after('planter_lkg_money');
            $table->decimal('association_dues_lkg_money', 16, 4)->nullable()->after('pdpa_lkg_money');
            $table->decimal('planter_mol_money', 16, 4)->nullable()->after('association_dues_lkg_money');
            $table->decimal('pdpa_mol_money', 16, 4)->nullable()->after('planter_mol_money');
            $table->decimal('association_dues_mol_money', 16, 4)->nullable()->after('pdpa_mol_money');
        });

        DB::table('productions')
            ->orderBy('id')
            ->chunkById(200, function ($productions): void {
                foreach ($productions as $production) {
                    if (empty($production->milling_period_id)) {
                        continue;
                    }

                    $millingPeriod = DB::table('milling_periods')->where('id', $production->milling_period_id)->first();

                    if ($millingPeriod === null || $millingPeriod->sugar_price === null || $millingPeriod->mol_price === null) {
                        continue;
                    }

                    $sugarUnitPrice = (float) $millingPeriod->sugar_price * (float) $millingPeriod->sugar_factor;
                    $molUnitPrice = (float) $millingPeriod->mol_price * (float) $millingPeriod->mol_factor;

                    $planterLkgMoney = round((float) $production->pshr_net_lkg * $sugarUnitPrice, 4);
                    $pdpaLkgMoney = round((float) $production->pdpa_lkg * $sugarUnitPrice, 4);
                    $associationDuesLkgMoney = round((float) $production->association_dues_lkg * $sugarUnitPrice, 4);

                    $planterMolMoney = round((float) $production->pshr_net_mol * $molUnitPrice, 4);
                    $pdpaMolMoney = round((float) $production->pdpa_mol * $molUnitPrice, 4);
                    $associationDuesMolMoney = round((float) $production->association_dues_mol * $molUnitPrice, 4);

                    DB::table('productions')
                        ->where('id', $production->id)
                        ->update([
                            'planter_lkg_money' => $planterLkgMoney,
                            'pdpa_lkg_money' => $pdpaLkgMoney,
                            'association_dues_lkg_money' => $associationDuesLkgMoney,
                            'planter_mol_money' => $planterMolMoney,
                            'pdpa_mol_money' => $pdpaMolMoney,
                            'association_dues_mol_money' => $associationDuesMolMoney,
                            'distribution_total' => round($planterLkgMoney + $pdpaLkgMoney + $associationDuesLkgMoney, 4),
                            'molasses_total' => round($planterMolMoney + $pdpaMolMoney + $associationDuesMolMoney, 4),
                        ]);
                }
            });
    }

    public function down(): void
    {
        Schema::table('productions', function (Blueprint $table) {
            $table->dropColumn([
                'planter_lkg_money',
                'pdpa_lkg_money',
                'association_dues_lkg_money',
                'planter_mol_money',
                'pdpa_mol_money',
                'association_dues_mol_money',
            ]);
        });
    }
};
