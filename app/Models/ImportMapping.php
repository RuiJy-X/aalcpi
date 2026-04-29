<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ImportMapping extends Model
{
    use HasFactory;

    protected $fillable = [
        'import_type',
        'header_signature',
        'headers',
        'mapping',
        'created_by',
    ];

    protected $casts = [
        'headers' => 'array',
        'mapping' => 'array',
    ];
}
