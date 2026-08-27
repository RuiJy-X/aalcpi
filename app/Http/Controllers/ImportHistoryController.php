<?php

namespace App\Http\Controllers;

use App\Jobs\ProcessBankReconImportJob;
use App\Jobs\ProcessExcelImportJob;
use App\Jobs\ProcessWeeklyImportJob;
use App\Models\BankStatement;
use App\Models\ImportJob;
use App\Models\InternalDisbursements;
use App\Models\Planter;
use App\Models\Production;
use App\Models\Weekly;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class ImportHistoryController extends Controller
{
    public function index(Request $request)
    {
        $type = $request->string('type')->toString();
        $status = $request->string('status')->toString();
        $search = $request->string('search')->toString();
        $perPage = (int) $request->input('per_page', 15);
        $sort = $request->string('sort')->toString() ?: 'created_at';
        $direction = strtolower($request->string('direction')->toString()) === 'asc' ? 'asc' : 'desc';

        if ($request->has('filters')) {
            $filtersParam = $request->input('filters', []);
            if (is_array($filtersParam)) {
                if (! empty($filtersParam['type'])) {
                    $type = is_array($filtersParam['type']) ? $filtersParam['type'][0] : $filtersParam['type'];
                }
                if (! empty($filtersParam['status'])) {
                    $status = is_array($filtersParam['status']) ? $filtersParam['status'][0] : $filtersParam['status'];
                }
            }
        }

        $query = ImportJob::query()->with('user:id,name');

        if ($type !== '' && $type !== 'all') {
            if ($type === 'bank_recon') {
                $query->whereIn('type', ['bank_recon_internal', 'bank_recon_bank', 'internal', 'bank']);
            } elseif ($type === 'productions' || $type === 'productions_excel') {
                $query->whereIn('type', ['productions', 'productions_excel']);
            } elseif ($type === 'weekly' || $type === 'weekly_pdf') {
                $query->whereIn('type', ['weekly', 'weekly_pdf']);
            } elseif ($type === 'planters' || $type === 'planters_excel') {
                $query->whereIn('type', ['planters', 'planters_excel']);
            } else {
                $query->where('type', $type);
            }
        }

        if ($status !== '' && $status !== 'all') {
            $query->where('status', $status);
        }

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('file_name', 'like', '%'.$search.'%')
                    ->orWhere('message', 'like', '%'.$search.'%');
            });
        }

        $allowedSorts = [
            'id' => 'import_jobs.id',
            'file_name' => 'import_jobs.file_name',
            'type' => 'import_jobs.type',
            'status' => 'import_jobs.status',
            'created_at' => 'import_jobs.created_at',
        ];

        if (isset($allowedSorts[$sort])) {
            $query->orderBy($allowedSorts[$sort], $direction);
        } else {
            $query->orderBy('import_jobs.created_at', 'desc');
        }

        $jobs = $query->paginate($perPage)->through(function (ImportJob $job) {
            $recordCount = 0;
            if (in_array($job->type, ['bank_recon_internal', 'internal'], true)) {
                $recordCount = InternalDisbursements::where('import_job_id', $job->id)->count();
                if ($recordCount === 0 && isset($job->context['rows_saved'])) {
                    $recordCount = (int) $job->context['rows_saved'];
                }
            } elseif (in_array($job->type, ['bank_recon_bank', 'bank'], true)) {
                $recordCount = BankStatement::where('import_job_id', $job->id)->count();
                if ($recordCount === 0 && isset($job->context['rows_saved'])) {
                    $recordCount = (int) $job->context['rows_saved'];
                }
            } elseif (in_array($job->type, ['planters', 'planters_excel'], true)) {
                $recordCount = Planter::where('import_job_id', $job->id)->count();
            } elseif (in_array($job->type, ['productions', 'productions_excel'], true)) {
                $recordCount = Production::where('import_job_id', $job->id)->count();
                if ($recordCount === 0 && isset($job->context['rows_saved'])) {
                    $recordCount = (int) $job->context['rows_saved'];
                }
                if ($recordCount === 0 && ! empty($job->context['crop_year'])) {
                    $recordCount = Production::where('crop_year', $job->context['crop_year'])->count();
                }
            } elseif (in_array($job->type, ['weekly', 'weekly_pdf'], true)) {
                $recordCount = Weekly::where('import_job_id', $job->id)->count();
                if ($recordCount === 0 && isset($job->context['rows_saved'])) {
                    $recordCount = (int) $job->context['rows_saved'];
                }
                if ($recordCount === 0 && ! empty($job->context['crop_year']) && ! empty($job->context['week'])) {
                    $recordCount = Weekly::where('crop_year', $job->context['crop_year'])
                        ->where('week', $job->context['week'])
                        ->count();
                }
            }

            $context = $job->context ?? [];
            if (! isset($context['rows_saved']) || (int) ($context['rows_saved'] ?? 0) === 0) {
                $context['rows_saved'] = $recordCount;
            }
            if (! isset($context['rows_read']) || (int) ($context['rows_read'] ?? 0) === 0) {
                $context['rows_read'] = $recordCount + (int) ($context['rows_skipped'] ?? 0);
            }

            return [
                'id' => $job->id,
                'type' => $job->type,
                'status' => $job->status,
                'message' => $job->message,
                'file_name' => $job->file_name ?? ($context['file_name'] ?? 'Import File'),
                'created_at' => $job->created_at?->toIso8601String(),
                'user_name' => $job->user?->name ?? 'System',
                'record_count' => $recordCount,
                'context' => $context,
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
            'table_state' => [
                'search' => $search,
                'sort' => $sort,
                'direction' => $direction,
                'filters' => array_filter([
                    'type' => $type,
                    'status' => $status,
                ]),
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
            } elseif (in_array($importJob->type, ['planters', 'planters_excel'], true)) {
                Planter::where('import_job_id', $importJob->id)->delete();
            } elseif (in_array($importJob->type, ['productions', 'productions_excel'], true)) {
                $deletedCount = Production::where('import_job_id', $importJob->id)->delete();
                if ($deletedCount === 0 && ! empty($importJob->context['crop_year'])) {
                    Production::where('crop_year', $importJob->context['crop_year'])->delete();
                }
            } elseif (in_array($importJob->type, ['weekly', 'weekly_pdf'], true)) {
                $cropYear = $importJob->context['crop_year'] ?? null;
                $week = $importJob->context['week'] ?? null;

                $weeklies = Weekly::where('import_job_id', $importJob->id)->get();
                if ($weeklies->isEmpty() && ! empty($cropYear) && ! empty($week)) {
                    $weeklies = Weekly::where('crop_year', $cropYear)
                        ->where('week', $week)
                        ->get();
                }

                foreach ($weeklies as $weekly) {
                    if ($weekly->file_location && Storage::disk('public')->exists($weekly->file_location)) {
                        Storage::disk('public')->delete($weekly->file_location);
                    }
                    $weekly->delete();
                }

                if (! empty($cropYear) && ! empty($week)) {
                    $relativeOutputDirectory = 'weekly-pdfs/'.Str::slug((string) $cropYear).'/week-'.Str::slug((string) $week);
                    Storage::disk('public')->deleteDirectory($relativeOutputDirectory);
                    Storage::disk('local')->deleteDirectory('temp-pdf-cache/'.Str::slug((string) $cropYear).'/week-'.Str::slug((string) $week));
                }
            }

            $importJob->delete();
        });

        return response()->json([
            'message' => 'Import batch and associated records deleted successfully.',
        ]);
    }

    public function runNow(Request $request, ImportJob $importJob): JsonResponse
    {
        $context = $importJob->context ?? [];
        $filePath = $context['file_path'] ?? null;

        if (! $filePath || ! Storage::disk('local')->exists($filePath)) {
            if ($importJob->status === ImportJob::STATUS_DONE) {
                return response()->json([
                    'success' => true,
                    'message' => 'Import job is already completed.',
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Uploaded import file is no longer available on server storage.',
            ], 422);
        }

        try {
            if (in_array($importJob->type, ['bank_recon_internal', 'bank_recon_bank', 'internal', 'bank'], true)) {
                $targetType = $context['target_type'] ?? (str_contains($importJob->type, 'bank') ? 'bank' : 'internal');
                ProcessBankReconImportJob::dispatchSync(
                    $importJob->id,
                    $targetType,
                    $filePath,
                    $context['date_issued'] ?? null,
                    isset($context['disbursement_week']) ? (int) $context['disbursement_week'] : null,
                    $context['bank_date'] ?? null,
                    $context['mapping'] ?? []
                );
            } elseif (in_array($importJob->type, ['weekly', 'weekly_pdf'], true)) {
                ProcessWeeklyImportJob::dispatchSync(
                    $filePath,
                    (string) ($context['week'] ?? ''),
                    (string) ($context['crop_year'] ?? ''),
                    $importJob->id
                );
            } else {
                ProcessExcelImportJob::dispatchSync(
                    $importJob->id,
                    $importJob->type,
                    $filePath,
                    $context
                );
            }

            $importJob->refresh();

            return response()->json([
                'success' => true,
                'message' => 'Import processed successfully!',
                'job' => [
                    'id' => $importJob->id,
                    'status' => $importJob->status,
                    'message' => $importJob->message,
                ],
            ]);
        } catch (\Throwable $e) {
            $importJob->markFailed($e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Import execution failed: '.$e->getMessage(),
            ], 500);
        }
    }
}
