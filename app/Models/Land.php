<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Land extends Model
{
    use HasFactory;

    protected $fillable = [
        'planter_id', 
        'name',
        'address', 
        'area_hectares',
        'distance_from_urc',
        'is_active'
    ];

    public function planter() {
        return $this->belongsTo(Planter::class);
    }

    public function productions() {
        return $this->hasMany(Production::class);
    }
}
