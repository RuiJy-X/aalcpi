<?php

namespace App\Http\Controllers;

use App\Models\BankStatement;
use App\Models\ImportJob;
use App\Models\InternalDisbursements;
use App\Models\Planter;
use App\Models\Production;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ImportHistoryController extends Controller
{
    public function index(Request $request)
    {
        $type = $request->string('type')->toString();
        $status = $request->string('status')->toString();
        $search = $request->string('search')->toString();

        $query = ImportJob::query()->with('user:id,name')->orderBy('created_at', 'desc');

        if ($type !== '') {
            if ($type === 'bank_recon') {
                $query->whereIn('type', ['bank_recon_internal', 'bank_recon_bank', 'internal', 'bank']);
            } else {
                $query->where('type', $type);
            }
        }

        if ($status !== '') {
            $query->where('status', $status);
        }

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('file_name', 'like', '%' . $search . '%')
                    ->orWhere('message', 'like', '%' . $search . '%');
            });
        }

        $jobs = $query->paginate(20)->through(function (ImportJob $job) {
            $recordCount = 0;
            if (in_array($job->type, ['bank_recon_internal', 'internal'], true)) {
                $recordCount = InternalDisbursements::where('import_job_id', $job->id)->count();
            } elseif (in_array($job->type, ['bank_recon_bank', 'bank'], true)) {
                $recordCount = BankStatement::where('import_job_id', $job->id)->count();
            } elseif ($job->type === 'planters') {
                $recordCount = Planter::where('import_job_id', $job->id)->count();
            } elseif ($job->type === 'productions') {
                $recordCount = Production::where('import_job_id', $job->id)->count();
            }

            return [
                'id' => $job->id,
                'type' => $job->type,
                'status' => $job->status,
                'message' => $job->message,
                'file_name' => $job->file_name ?? ($job->context['file_name'] ?? 'Spreadsheet File'),
                'created_at' => $job->created_at?->toIso8601String(),
                'user_name' => $job->user?->name ?? 'System',
                'record_count' => $recordCount,
                'context' => $job->context,
            ];
        });

        if ($request->wantsJson()) {
            return response()->json([
                'jobs' => $jobs->items(),
                'pagination' => [
                    'total' => $jobs->total(),
                    'per_page' => $jobs->perPage(),
                    'current_page' => $jobs->currentPage(),
                    'last_page' => $jobs->lastPage(),
                ],
            ]);
        }

        $stats = [
            'total' => ImportJob::count(),
            'done' => ImportJob::where('status', ImportJob::STATUS_DONE)->count(),
            'failed' => ImportJob::where('status', ImportJob::STATUS_FAILED)->count(),
            'running' => ImportJob::whereIn('status', [ImportJob::STATUS_QUEUED, ImportJob::STATUS_RUNNING])->count(),
        ];

        return Inertia::render('Imports/History', [
            'jobs' => $jobs->items(),
            'pagination' => [
                'total' => $jobs->total(),
                'per_page' => $jobs->perPage(),
                'current_page' => $jobs->currentPage(),
                'last_page' => $jobs->lastPage(),
            ],
            'filters' => [
                'type' => $type,
                'status' => $status,
                'search' => $search,
            ],
            'stats' => $stats,
        ]);
    }

    public function destroy(Request $request, ImportJob $importJob): JsonResponse
    {
        DB::transaction(function () use ($importJob) {
            if (in_array($importJob->type, ['bank_recon_internal', 'internal'], true)) {
                $internalIds = InternalDisbursements::where('import_job_id', $importJob->id)->pluck('id');
                InternalDisbursements::whereIn('id', $internalIds)->delete();
                InternalDisbursements::reconcileUnmatched();
                BankStatement::refreshDuplicateFlags();
                InternalDisbursements::refreshDuplicateFlags();
            } elseif (in_array($importJob->type, ['bank_recon_bank', 'bank'], true)) {
                $bankIds = BankStatement::where('import_job_id', $importJob->id)->pluck('id');
                InternalDisbursements::whereIn('bank_statement_id', $bankIds)->update(['bank_statement_id' => null]);
                BankStatement::whereIn('id', $bankIds)->delete();
                InternalDisbursements::reconcileUnmatched();
                BankStatement::refreshDuplicateFlags();
                InternalDisbursements::refreshDuplicateFlags();
            } elseif ($importJob->type === 'planters') {
                Planter::where('import_job_id', $importJob->id)->delete();
            } elseif ($importJob->type === 'productions') {
                Production::where('import_job_id', $importJob->id)->delete();
            }

            $importJob->delete();
        });

        return response()->json([
            'message' => 'Import batch and associated records deleted successfully.',
        ]);
    }
}
