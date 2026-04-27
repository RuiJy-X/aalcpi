<?php

namespace App\Http\Controllers;

use App\Models\Certification;
use App\Models\Production;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {

        return Inertia::render('dashboard');
    }
}
