<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Production extends Model
{
    use HasFactory;

    public const FINANCIAL_STATUS_PENDING_PRICE = 'pending_price';
    public const FINANCIAL_STATUS_CALCULATED_PENDING_REVIEW = 'calculated_pending_review';
    public const FINANCIAL_STATUS_ACCEPTED = 'accepted';

        protected $fillable = [
            'planter_id', 'hacienda_id', 'milling_period_id', 'planter_code', 'hacienda_code',
        'production_date',
        'crop_year',
        'gross_cw', 'net_cw', 'trucks', 'theoretical_lkg', 'actual_lkg',
        'pshr_net_lkg', 'pdpa_lkg', 'association_dues_lkg', 'actual_mol',
        'pshr_net_mol', 'pdpa_mol', 'association_dues_mol', 'trans_code', 'transloading',
        'financial_status', 'distribution_total', 'molasses_total', 'financial_calculated_at',
        'planter_lkg_money', 'pdpa_lkg_money', 'association_dues_lkg_money',
        'planter_mol_money', 'pdpa_mol_money', 'association_dues_mol_money',
        'financial_reviewed_at', 'financial_reviewed_by', 'financial_rejection_reason',
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
        'financial_calculated_at' => 'datetime',
        'financial_reviewed_at' => 'datetime',
        'transloading' => 'boolean',
    ];

    public function planter() { return $this->belongsTo(Planter::class); }
    public function hacienda() { return $this->belongsTo(Hacienda::class); }
    public function millingPeriod() { return $this->belongsTo(MillingPeriod::class); }
    public function certification() { return $this->hasOne(Certification::class); }
}
