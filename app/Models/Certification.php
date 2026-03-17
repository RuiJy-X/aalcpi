<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Certification extends Model
{
    use HasFactory;

    protected $fillable = [
        'planter_id',
        'hacienda_id',
        'production_id',
        'certification_type',
        'issue_date',
        'status'
    ];

    public function production() { return $this->belongsTo(Production::class); }
    public function planter() { return $this->belongsTo(Planter::class); }
    public function hacienda() { return $this->belongsTo(Hacienda::class); }
}
