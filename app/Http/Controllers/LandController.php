<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\Planter;
use App\Models\Production;
use App\Models\Certification;
use App\Models\Land;
use Inertia\Inertia;
use Illuminate\Support\Facades\Schema;

class LandController extends Controller
{
    public function index(){
        $lands = Land::with('planter')->get()->map(function ($land) {
            $land->planter_name = $land->planter ? $land->planter->name : null;
            return $land;
        });
        return Inertia::render('Lands/Index', ['lands' => $lands]);
    }
}
