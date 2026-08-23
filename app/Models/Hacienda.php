<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Hacienda extends Model
{
    use HasFactory;

    protected $fillable = [
        'planter_id',
        'hacienda_code',
        'name',
        'address',
        'area_hectares',
        'distance_from_urc',
        'is_active',
    ];

    public function planter()
    {
        return $this->belongsTo(Planter::class);
    }

    public function productions()
    {
        return $this->hasMany(Production::class);
    }
}
