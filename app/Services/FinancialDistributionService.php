<?php

namespace App\Services;

use App\Models\MillingPeriod;
use App\Models\Production;
use Carbon\Carbon;

class FinancialDistributionService
{
    public function syncAndRecalculateForMillingPeriod(MillingPeriod $millingPeriod): int
    {
        $this->syncProductionMillingPeriodLinks($millingPeriod);

        if (!$this->hasPricing($millingPeriod)) {
            $this->markMillingPeriodProductionsPendingPrice($millingPeriod);
            return 0;
        }

        $updated = 0;

        Production::query()
            ->where('milling_period_id', $millingPeriod->id)
            ->where('financial_status', '!=', Production::FINANCIAL_STATUS_ACCEPTED)
            ->orderBy('id')
            ->cursor()
            ->each(function (Production $production) use (&$updated, $millingPeriod): void {
                $this->applyCalculatedSnapshot($production, $millingPeriod);
                $updated++;
            });

        return $updated;
    }

    public function syncAndCalculateForProduction(Production $production): void
    {
        $millingPeriod = $this->resolveMillingPeriodForProduction($production);

        if ($production->milling_period_id !== $millingPeriod?->id) {
            $production->milling_period_id = $millingPeriod?->id;
        }

        if ($production->financial_status === Production::FINANCIAL_STATUS_ACCEPTED) {
            $production->saveQuietly();
            return;
        }

        if ($millingPeriod === null || !$this->hasPricing($millingPeriod)) {
            $this->markProductionPendingPrice($production);
            return;
        }

        $this->applyCalculatedSnapshot($production, $millingPeriod);
    }

    public function estimateAffectedProductionCount(MillingPeriod $millingPeriod): int
    {
        return Production::query()
            ->whereDate('production_date', '>=', Carbon::parse($millingPeriod->start_date)->toDateString())
            ->whereDate('production_date', '<=', Carbon::parse($millingPeriod->end_date)->toDateString())
            ->count();
    }

    private function syncProductionMillingPeriodLinks(MillingPeriod $millingPeriod): void
    {
        Production::query()
            ->whereDate('production_date', '>=', Carbon::parse($millingPeriod->start_date)->toDateString())
            ->whereDate('production_date', '<=', Carbon::parse($millingPeriod->end_date)->toDateString())
            ->where(function ($query) use ($millingPeriod): void {
                $query->whereNull('milling_period_id')
                    ->orWhere('milling_period_id', '!=', $millingPeriod->id);
            })
            ->update(['milling_period_id' => $millingPeriod->id]);
    }

    private function markMillingPeriodProductionsPendingPrice(MillingPeriod $millingPeriod): void
    {
        Production::query()
            ->where('milling_period_id', $millingPeriod->id)
            ->where('financial_status', '!=', Production::FINANCIAL_STATUS_ACCEPTED)
            ->update([
                'financial_status' => Production::FINANCIAL_STATUS_PENDING_PRICE,
                'distribution_total' => null,
                'molasses_total' => null,
                'planter_lkg_money' => null,
                'pdpa_lkg_money' => null,
                'association_dues_lkg_money' => null,
                'planter_mol_money' => null,
                'pdpa_mol_money' => null,
                'association_dues_mol_money' => null,
                'financial_calculated_at' => null,
            ]);
    }

    private function markProductionPendingPrice(Production $production): void
    {
        $production->financial_status = Production::FINANCIAL_STATUS_PENDING_PRICE;
        $production->distribution_total = null;
        $production->molasses_total = null;
        $production->planter_lkg_money = null;
        $production->pdpa_lkg_money = null;
        $production->association_dues_lkg_money = null;
        $production->planter_mol_money = null;
        $production->pdpa_mol_money = null;
        $production->association_dues_mol_money = null;
        $production->financial_calculated_at = null;
        $production->saveQuietly();
    }

    private function applyCalculatedSnapshot(Production $production, MillingPeriod $millingPeriod): void
    {
        $sugarUnitPrice = (float) $millingPeriod->sugar_price ;
        $molUnitPrice = (float) $millingPeriod->mol_price;

        $planterLkgMoney = round((float) $production->pshr_net_lkg * $sugarUnitPrice, 4);
        $pdpaLkgMoney = round((float) $production->pdpa_lkg * 50, 4);
        $associationDuesLkgMoney = round((float) $production->association_dues_lkg * $sugarUnitPrice, 4);

        $planterMolMoney = round((float) $production->pshr_net_mol * $molUnitPrice, 4);
        $pdpaMolMoney = round((float) $production->pdpa_mol * 50, 4);
        $associationDuesMolMoney = round((float) $production->association_dues_mol * $molUnitPrice, 4);

        $distributionTotal = round($planterLkgMoney + $pdpaLkgMoney + $associationDuesLkgMoney, 4);
        $molassesTotal = round($planterMolMoney + $pdpaMolMoney + $associationDuesMolMoney, 4);

        $production->distribution_total = $distributionTotal;
        $production->molasses_total = $molassesTotal;
        $production->planter_lkg_money = $planterLkgMoney;
        $production->pdpa_lkg_money = $pdpaLkgMoney;
        $production->association_dues_lkg_money = $associationDuesLkgMoney;
        $production->planter_mol_money = $planterMolMoney;
        $production->pdpa_mol_money = $pdpaMolMoney;
        $production->association_dues_mol_money = $associationDuesMolMoney;
        $production->financial_status = Production::FINANCIAL_STATUS_CALCULATED_PENDING_REVIEW;
        $production->financial_calculated_at = now();
        $production->financial_reviewed_at = null;
        $production->financial_reviewed_by = null;
        $production->financial_rejection_reason = null;
        $production->saveQuietly();
    }

    private function resolveMillingPeriodForProduction(Production $production): ?MillingPeriod
    {
        if (empty($production->production_date)) {
            return null;
        }

        $productionDate = Carbon::parse($production->production_date)->toDateString();

        return MillingPeriod::query()
            ->whereDate('start_date', '<=', $productionDate)
            ->whereDate('end_date', '>=', $productionDate)
            ->orderBy('start_date')
            ->first();
    }

    private function hasPricing(MillingPeriod $millingPeriod): bool
    {
        return $millingPeriod->sugar_price !== null && $millingPeriod->mol_price !== null;
    }
}
