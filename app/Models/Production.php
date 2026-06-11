<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Production extends Model
{
    use HasFactory;


        protected $fillable = [
            'planter_id', 'hacienda_id', 'milling_period_id', 'planter_code', 'hacienda_code',
        'crop_year',
        'gross_cw', 'net_cw', 'trucks', 'theoretical_lkg', 'actual_lkg',
        'pshr_net_lkg', 'pdpa_lkg', 'association_dues_lkg', 'actual_mol',
        'pshr_net_mol', 'pdpa_mol', 'association_dues_mol', 'trans_code', 'transloading',
        'composite_sugar_price', 'composite_molasses_price','status'

    ];

    protected $casts = [
        'production_date' => 'date',
        'distribution_total' => 'decimal:4',
        'molasses_total' => 'decimal:4',
        'planter_lkg_money' => 'decimal:4',
        'pdpa_lkg_money' => 'decimal:4',
        'association_dues_lkg_money' => 'decimal:4',
        'planter_mol_money' => 'decimal:4',
        'pdpa_mol_money' => 'decimal:4',
        'association_dues_mol_money' => 'decimal:4',
        'composite_sugar_price' => 'decimal:4',
        'composite_molasses_price' => 'decimal:4',
        'financial_calculated_at' => 'datetime',
        'financial_reviewed_at' => 'datetime',
        'transloading' => 'boolean',
    ];

    public function planter() { return $this->belongsTo(Planter::class); }
    public function hacienda() { return $this->belongsTo(Hacienda::class); }
    public function millingPeriod() { return $this->belongsTo(MillingPeriod::class); }
}
