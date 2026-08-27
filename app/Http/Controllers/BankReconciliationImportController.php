<?php

namespace App\Http\Controllers;

use App\Jobs\ProcessBankReconImportJob;
use App\Models\ImportJob;
use App\Models\ImportMapping;
use App\Services\Imports\BankReconDuplicateAnalyzer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class BankReconciliationImportController extends Controller
{
    public function __construct(
        protected BankReconDuplicateAnalyzer $duplicateAnalyzer
    ) {}

    /**
     * Pre-analyze a spreadsheet file for duplicates and validation errors before database modification.
     */
    public function analyze(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls,csv'],
            'type' => ['required', 'in:internal,bank'],
            'date_issued' => ['required_if:type,internal', 'nullable', 'date'],
            'disbursement_week' => ['required_if:type,internal', 'nullable', 'integer', 'min:1'],
            'bank_date' => ['required_if:type,bank', 'nullable', 'date'],
            'mapping_id' => ['nullable', 'integer', 'exists:import_mappings,id'],
            'mapping' => ['nullable', 'array'],
        ]);

        $file = $validated['file'];
        $type = $validated['type'];
        $dateIssued = $validated['date_issued'] ?? null;
        $disbursementWeek = $validated['disbursement_week'] ?? null;
        $bankDate = $validated['bank_date'] ?? null;
        $mappingId = $validated['mapping_id'] ?? null;

        $mappingArray = $validated['mapping'] ?? [];
        if ($mappingId && empty($mappingArray)) {
            $mappingModel = ImportMapping::query()->where('id', $mappingId)->first();
            $mappingArray = $mappingModel?->mapping ?? [];
        }

        // Store file temporarily for analysis & potential execution
        $storedPath = $file->store('imports/bank-recon/staging', 'local');
        $fullPath = Storage::disk('local')->path($storedPath);

        $batchContext = [
            'date_issued' => $dateIssued,
            'disbursement_week' => $disbursementWeek,
            'bank_date' => $bankDate,
            'mapping_id' => $mappingId,
            'file_name' => $file->getClientOriginalName(),
        ];

        $analysisResult = $this->duplicateAnalyzer->analyze(
            $fullPath,
            $type,
            $batchContext,
            $mappingArray
        );

        $analysisToken = (string) Str::uuid();

        Cache::put("import_analysis_{$analysisToken}", [
            'type' => $type,
            'stored_path' => $storedPath,
            'file_name' => $file->getClientOriginalName(),
            'batch_context' => $batchContext,
            'mapping' => $mappingArray,
            'analysis' => $analysisResult,
        ], now()->addHours(2));

        return response()->json([
            'analysis_token' => $analysisToken,
            'file_name' => $file->getClientOriginalName(),
            'type' => $type,
            ...$analysisResult,
        ]);
    }

    /**
     * Execute the import job with user-approved duplicate resolutions.
     */
    public function import(Request $request)
    {
        $validated = $request->validate([
            'analysis_token' => ['nullable', 'string'],
            'file' => ['required_without:analysis_token', 'file', 'mimes:xlsx,xls,csv'],
            'type' => ['required_without:analysis_token', 'in:internal,bank'],
            'date_issued' => ['required_if:type,internal', 'nullable', 'date'],
            'disbursement_week' => ['required_if:type,internal', 'nullable', 'integer', 'min:1'],
            'bank_date' => ['required_if:type,bank', 'nullable', 'date'],
            'mapping_id' => ['nullable', 'integer', 'exists:import_mappings,id'],
            'duplicate_resolutions' => ['nullable', 'array'],
        ]);

        $duplicateResolutions = $validated['duplicate_resolutions'] ?? [];
        $analysisToken = $validated['analysis_token'] ?? null;

        if ($analysisToken && Cache::has("import_analysis_{$analysisToken}")) {
            $cached = Cache::get("import_analysis_{$analysisToken}");
            $type = $cached['type'];
            $storedPath = $cached['stored_path'];
            $fileName = $cached['file_name'];
            $batchContext = $cached['batch_context'];
            $mapping = $cached['mapping'];
            $dateIssued = $batchContext['date_issued'] ?? null;
            $disbursementWeek = $batchContext['disbursement_week'] ?? null;
            $bankDate = $batchContext['bank_date'] ?? null;
            $mappingId = $batchContext['mapping_id'] ?? null;
            $preAnalysis = $cached['analysis'] ?? null;
        } else {
            $file = $validated['file'];
            $type = $validated['type'];
            $dateIssued = $validated['date_issued'] ?? null;
            $disbursementWeek = $validated['disbursement_week'] ?? null;
            $bankDate = $validated['bank_date'] ?? null;
            $mappingId = $validated['mapping_id'] ?? null;
            $fileName = $file->getClientOriginalName();

            $mapping = [];
            if ($mappingId) {
                $mappingModel = ImportMapping::query()->where('id', $mappingId)->first();
                $mapping = $mappingModel?->mapping ?? [];
            }

            $storedPath = $file->store('imports/bank-recon', 'local');
            $preAnalysis = null;
        }

        // Register the audit tracking record in the database
        $importJob = ImportJob::create([
            'user_id' => $request->user()?->id,
            'type' => 'bank_recon_'.$type, // bank_recon_internal or bank_recon_bank
            'status' => ImportJob::STATUS_QUEUED,
            'file_name' => $fileName,
            'context' => [
                'file_path' => $storedPath,
                'target_type' => $type,
                'date_issued' => $dateIssued,
                'disbursement_week' => $disbursementWeek,
                'bank_date' => $bankDate,
                'mapping_id' => $mappingId,
                'duplicate_resolutions' => $duplicateResolutions,
                'pre_analysis' => $preAnalysis ? [
                    'total_rows' => $preAnalysis['total_rows'] ?? 0,
                    'new_rows_count' => $preAnalysis['new_rows_count'] ?? 0,
                    'exact_duplicates_count' => $preAnalysis['exact_duplicates_count'] ?? 0,
                    'possible_duplicates_count' => $preAnalysis['possible_duplicates_count'] ?? 0,
                    'invalid_rows_count' => $preAnalysis['invalid_rows_count'] ?? 0,
                ] : null,
            ],
        ]);

        // Dispatch background processing job
        ProcessBankReconImportJob::dispatch(
            $importJob->id,
            $type,
            $storedPath,
            $dateIssued,
            $disbursementWeek ? (int) $disbursementWeek : null,
            $bankDate,
            $mapping,
            $duplicateResolutions
        );

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Your ledger file has been successfully queued for processing.',
                'import_job_id' => $importJob->id,
            ]);
        }

        return back()
            ->with('success', 'Your ledger file has been successfully queued for background processing.')
            ->with('import_job_id', $importJob->id);
    }
}
