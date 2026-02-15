<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

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
}
