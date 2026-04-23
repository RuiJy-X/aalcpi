<?php

namespace App\Observers;

use App\Models\Production;
use App\Services\FinancialDistributionService;

class ProductionObserver
{
    public function __construct(private readonly FinancialDistributionService $distributionService)
    {
    }

    public function created(Production $production): void
    {
        $this->distributionService->syncAndCalculateForProduction($production);
    }

    public function updated(Production $production): void
    {
        if (!$this->shouldSyncAfterUpdate($production)) {
            return;
        }

        $this->distributionService->syncAndCalculateForProduction($production);
    }

    private function shouldSyncAfterUpdate(Production $production): bool
    {
        return $production->wasChanged([
            'production_date',
            'crop_year',
            'pshr_net_lkg',
            'pshr_net_mol',
        ]);
    }
}
