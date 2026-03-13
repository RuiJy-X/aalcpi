<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Production extends Model
{
    use HasFactory;

        protected $fillable = [
            'planter_id', 'land_id','planter_code','land_code', 'production_year', 'production_month',
        'gross_cw', 'net_cw', 'trucks', 'theoretical_lkg', 'actual_lkg',
        'pshr_net_lkg', 'pdpa_lkg', 'association_dues_lkg', 'actual_mol',
        'pshr_net_mol', 'pdpa_mol', 'association_dues_mol', 'trans_code', 'transloading'
    ];

    public function planter() { return $this->belongsTo(Planter::class); }
    public function land() { return $this->belongsTo(Land::class); }
    public function certification() { return $this->hasOne(Certification::class); }
}
