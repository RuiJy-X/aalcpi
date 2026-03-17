<?php

namespace Database\Factories;

use App\Models\Hacienda;
use App\Models\Planter;
use App\Models\Production;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Certification>
 */
class CertificationFactory extends Factory
{
    public function definition(): array
    {
        return [
            'planter_id' => Planter::factory(),
            'hacienda_id' => Hacienda::factory(),
            'production_id' => Production::factory(),
            'certification_type' => fake()->randomElement(['Organic', 'Good Agricultural Practices', 'Fair Trade', 'Other']),
            'issue_date' => fake()->date(),
            'status' => fake()->randomElement(['pending', 'approved', 'rejected', 'expired']),
        ];
    }

    public function forProduction(Production $production): static
    {
        return $this->state(fn () => [
            'production_id' => $production->id,
            'planter_id' => $production->planter_id,
            'hacienda_id' => $production->hacienda_id,
        ]);
    }
}
