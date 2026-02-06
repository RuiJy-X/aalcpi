<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class PlanterController extends Controller
{
    //
    public function index()
    {
        return Inertia::render('Planters/Index');
        
    }

    public function create(){
       return Inertia::render('Planters/Create');
    }
}   
