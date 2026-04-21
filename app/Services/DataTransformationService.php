<?php

namespace App\Services;

use App\Models\Hacienda;
use App\Models\MillingPeriod;
use App\Models\Planter;
use App\Models\Production;
use App\Models\RawData;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class DataTransformationService
{
    public function processRawData(RawData $rawData): Production
    {
        return DB::transaction(function () use ($rawData) {
            $rawData->refresh();

            if ($rawData->processing_status === RawData::STATUS_PROCESSED && $rawData->production_id !== null) {
                return Production::findOrFail($rawData->production_id);
            }

            [$planter, $hacienda] = $this->resolvePlanterAndHacienda($rawData->planter_code);
            $millingPeriod = $this->resolveMillingPeriod($rawData);
            $payload = $this->mapRawDataToProductionPayload($rawData, $planter, $hacienda, $millingPeriod);

            $production = Production::create($payload);

            $rawData->forceFill([
                'processing_status' => RawData::STATUS_PROCESSED,
                'processed_at' => now(),
                'production_id' => $production->id,
            ])->save();

            return $production;
        });
    }

    public function mapRawDataToProductionPayload(
        RawData $rawData,
        Planter $planter,
        ?Hacienda $hacienda,
        ?MillingPeriod $millingPeriod = null,
    ): array {
        $actualLkg = (float) $rawData->actual_lkg;

        $pdpaRate = (float) config('transformation.pdpa_lkg_rate', 0.02);
        $associationRate = (float) config('transformation.association_dues_lkg_rate', 0.01);

        $pdpaLkg = $this->roundAmount($actualLkg * $pdpaRate);
        $associationDuesLkg = $this->roundAmount($actualLkg * $associationRate);
        $pshrNetLkg = $this->roundAmount(max(0, $actualLkg - $pdpaLkg - $associationDuesLkg));

        $molFactor = (float) ($millingPeriod?->mol_factor ?? 0);
        $actualMol = $this->roundAmount($actualLkg * $molFactor);
        $pdpaMol = $this->roundAmount($pdpaLkg * $molFactor);
        $associationDuesMol = $this->roundAmount($associationDuesLkg * $molFactor);
        $pshrNetMol = $this->roundAmount(max(0, $actualMol - $pdpaMol - $associationDuesMol));

        $date = $rawData->date instanceof Carbon
            ? $rawData->date
            : Carbon::parse($rawData->date);

        return [
            'planter_id' => $planter->id,
            'hacienda_id' => $hacienda?->id,
            'planter_code' => $planter->planter_code,
            'hacienda_code' => $hacienda?->hacienda_code ?? 'UNASSIGNED',
            'production_year' => (int) $date->format('Y'),
            'production_month' => $date->format('F'),
            'gross_cw' => (float) $rawData->gross_cw,
            'net_cw' => (float) $rawData->net_cw,
            'trucks' => (int) round((float) $rawData->trucks),
            'theoretical_lkg' => (float) $rawData->theoretical_lkg,
            'actual_lkg' => $actualLkg,
            'pshr_net_lkg' => $pshrNetLkg,
            'pdpa_lkg' => $pdpaLkg,
            'association_dues_lkg' => $associationDuesLkg,
            'actual_mol' => $actualMol,
            'pshr_net_mol' => $pshrNetMol,
            'pdpa_mol' => $pdpaMol,
            'association_dues_mol' => $associationDuesMol,
            'trans_code' => $this->buildTransCode($rawData, $date),
            'transloading' => false,
        ];
    }

    private function resolvePlanterAndHacienda(string $planterCode): array
    {
        $planter = Planter::with(['haciendas' => fn ($query) => $query
            ->orderByDesc('is_active')
            ->orderBy('id')])
            ->where('planter_code', $planterCode)
            ->first();

        if ($planter === null) {
            throw new InvalidArgumentException("Planter code {$planterCode} was not found in the planters table.");
        }

        return [$planter, $planter->haciendas->first()];
    }

    private function resolveMillingPeriod(RawData $rawData): ?MillingPeriod
    {
        $date = $rawData->date instanceof Carbon
            ? $rawData->date
            : Carbon::parse($rawData->date);

        $period = MillingPeriod::query()
            ->where('crop_year', $rawData->crop_year)
            ->whereDate('start_date', '<=', $date)
            ->whereDate('end_date', '>=', $date)
            ->first();

        if ($period instanceof MillingPeriod) {
            return $period;
        }

        $fallbackPeriod = MillingPeriod::query()
            ->whereDate('start_date', '<=', $date)
            ->whereDate('end_date', '>=', $date)
            ->first();

        return $fallbackPeriod instanceof MillingPeriod ? $fallbackPeriod : null;
    }

    private function buildTransCode(RawData $rawData, Carbon $date): string
    {
        return sprintf('RAW-%s-%d-%s', $rawData->crop_year, $rawData->id, $date->format('Ymd'));
    }

    private function roundAmount(float $value): float
    {
        return round($value, 2);
    }
}
