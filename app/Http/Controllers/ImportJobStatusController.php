<?php

namespace App\Http\Controllers;

use App\Models\ImportJob;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ImportJobStatusController extends Controller
{
    public function show(Request $request, ImportJob $importJob): JsonResponse
    {
        $userId = $request->user()?->id;

        if ($importJob->user_id && $userId && $importJob->user_id !== $userId) {
            abort(403);
        }

        return response()->json([
            'id' => $importJob->id,
            'type' => $importJob->type,
            'status' => $importJob->status,
            'message' => $importJob->message,
            'started_at' => $importJob->started_at?->toIso8601String(),
            'finished_at' => $importJob->finished_at?->toIso8601String(),
        ]);
    }
}
