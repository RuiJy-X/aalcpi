<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class MillingPeriod extends Model
{
    use HasFactory;

    protected $fillable = [
        'week_no', 'crop_year', 'start_date', 'end_date', 'sugar_factor', 'mol_factor', 'sugar_price', 'mol_price'
    ];

    public function productions()
    {
        return $this->hasMany(Production::class);
    }
}
