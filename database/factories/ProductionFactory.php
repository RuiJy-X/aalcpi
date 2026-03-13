<?php

namespace Database\Factories;

use App\Models\Land;
use App\Models\Planter;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Production>
 */
class ProductionFactory extends Factory
{
    public function definition(): array
    {
        $grossCw = fake()->randomFloat(2, 10, 5000);
        $netCw = max(0, $grossCw - fake()->randomFloat(2, 0, 50));

        $actualLkg = fake()->randomFloat(2, 0, 5000);
        $pshrNetLkg = fake()->randomFloat(2, 0, $actualLkg);
        $pdpaLkg = fake()->randomFloat(2, 0, max(0, $actualLkg - $pshrNetLkg));
        $associationDuesLkg = fake()->randomFloat(2, 0, max(0, $actualLkg - $pshrNetLkg - $pdpaLkg));

        $actualMol = fake()->randomFloat(2, 0, 5000);
        $pshrNetMol = fake()->randomFloat(2, 0, $actualMol);
        $pdpaMol = fake()->randomFloat(2, 0, max(0, $actualMol - $pshrNetMol));
        $associationDuesMol = fake()->randomFloat(2, 0, max(0, $actualMol - $pshrNetMol - $pdpaMol));

        $planter = Planter::factory();
        $land = Land::factory()->for($planter);

        return [
            'planter_id' => $planter,
            'land_id' => $land,
            'production_year' => fake()->numberBetween(2015, (int) date('Y')),
            'production_month' => fake()->monthName(),
            'planter_code' => fn (array $attributes) => Planter::query()->whereKey($attributes['planter_id'])->value('planter_code'),
            'land_code' => fn (array $attributes) => Land::query()->whereKey($attributes['land_id'])->value('land_code'),
            'gross_cw' => $grossCw,
            'net_cw' => $netCw,
            'trucks' => fake()->numberBetween(1, 50),
            'theoretical_lkg' => fake()->randomFloat(2, 0, 5000),
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

    public function forPlanterLand(Planter $planter, Land $land): static
    {
        if ($land->planter_id !== $planter->id) {
            throw new \InvalidArgumentException('The given land does not belong to the given planter.');
        }

        return $this->state(fn () => [
            'planter_id' => $planter->id,
            'land_id' => $land->id,
            'planter_code' => $planter->planter_code,
            'land_code' => $land->land_code,
        ]);
    }
}
