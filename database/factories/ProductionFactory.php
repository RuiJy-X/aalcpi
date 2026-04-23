<?php

namespace Database\Factories;

use App\Models\Hacienda;
use App\Models\MillingPeriod;
use App\Models\Planter;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Production>
 */
class ProductionFactory extends Factory
{
    public function definition(): array
    {
        // Use realistic production relationships so seeded records look like operational data.
        $netCw = fake()->randomFloat(3, 5, 20);
        $grossCw = round($netCw + fake()->randomFloat(3, 0.2, 1.5), 3);

        $lkgPerTcFactor = fake()->randomFloat(4, 1.3, 1.8);
        $actualLkg = round($netCw * $lkgPerTcFactor, 4);
        $pshrNetLkg = round($actualLkg * 0.64, 4);
        $pdpaLkg = round($pshrNetLkg * 0.02, 4);
        $associationDuesLkg = round($pshrNetLkg * 0.01, 4);

        $actualMol = round($netCw * 35, 4);
        $pshrNetMol = round($actualMol * 0.64, 4);
        $pdpaMol = round($pshrNetMol * 0.02, 4);
        $associationDuesMol = round($pshrNetMol * 0.01, 4);

        $planter = Planter::factory();
        $hacienda = Hacienda::factory()->for($planter);

        $millingPeriod = MillingPeriod::query()->inRandomOrder()->first();

        if ($millingPeriod) {
            $startDate = \Illuminate\Support\Carbon::parse($millingPeriod->start_date);
            $endDate = \Illuminate\Support\Carbon::parse($millingPeriod->end_date);
            $productionDate = fake()->dateTimeBetween($startDate, $endDate);
        } else {
            $productionDate = fake()->dateTimeBetween('-2 years', 'now');
        }

        return [
            'planter_id' => $planter,
            'hacienda_id' => $hacienda,
            'production_date' => $productionDate->format('Y-m-d'),
            'crop_year' => $this->formatCropYear((int) $productionDate->format('Y')),
            'planter_code' => fn (array $attributes) => Planter::query()->whereKey($attributes['planter_id'])->value('planter_code'),
            'hacienda_code' => fn (array $attributes) => Hacienda::query()->whereKey($attributes['hacienda_id'])->value('hacienda_code'),
            'gross_cw' => $grossCw,
            'net_cw' => $netCw,
            'trucks' => fake()->numberBetween(1, 3),
            'theoretical_lkg' => round($actualLkg * fake()->randomFloat(4, 0.97, 1.03), 4),
            'actual_lkg' => $actualLkg,
            'pshr_net_lkg' => $pshrNetLkg,
            'pdpa_lkg' => $pdpaLkg,
            'association_dues_lkg' => $associationDuesLkg,
            'actual_mol' => $actualMol,
            'pshr_net_mol' => $pshrNetMol,
            'pdpa_mol' => $pdpaMol,
            'association_dues_mol' => $associationDuesMol,
            'trans_code' => strtoupper(fake()->bothify('TRN-########')),
            'transloading' => fake()->boolean(20),
        ];
    }

    public function forPlanterhacienda(Planter $planter, Hacienda $hacienda): static
    {
        if ($hacienda->planter_id !== $planter->id) {
            throw new \InvalidArgumentException('The given hacienda does not belong to the given planter.');
        }

        return $this->state(fn () => [
            'planter_id' => $planter->id,
            'hacienda_id' => $hacienda->id,
            'planter_code' => $planter->planter_code,
            'hacienda_code' => $hacienda->hacienda_code,
        ]);
    }

    private function formatCropYear(int $startYear): string
    {
        return sprintf('%04d-%04d', $startYear, $startYear + 1);
    }
}
