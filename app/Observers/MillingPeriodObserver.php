<?php

namespace App\Observers;

use App\Models\MillingPeriod;
use App\Services\FinancialDistributionService;

class MillingPeriodObserver
{
    public function __construct(private readonly FinancialDistributionService $distributionService)
    {
    }

    public function saved(MillingPeriod $millingPeriod): void
    {
        if (!$this->shouldRecalculate($millingPeriod)) {
            return;
        }

        $this->distributionService->syncAndRecalculateForMillingPeriod($millingPeriod);
    }


    private function shouldRecalculate(MillingPeriod $millingPeriod): bool
    {
        if ($millingPeriod->wasRecentlyCreated) {
            return true;
        }

        return $millingPeriod->wasChanged([
            'start_date',
            'end_date',
            'sugar_factor',
            'mol_factor',
            'sugar_price',
            'mol_price',
        ]);
    }
}
