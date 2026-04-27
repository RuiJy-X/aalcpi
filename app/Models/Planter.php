<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Planter extends Model
{
    use HasFactory;

    protected $fillable = [
        'planter_code',
        'name',
        'address',
        'contact_number',
        'tin_number',
        'registration_date'
    ];

    public function haciendas(): HasMany
    {
        return $this->hasMany(Hacienda::class);
    }

    public function productions(): HasMany
    {
        return $this->hasMany(Production::class);
    }


}
