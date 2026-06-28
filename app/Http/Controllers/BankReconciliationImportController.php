<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\ImportJob;
use App\Jobs\ProcessBankReconImportJob;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class BankReconciliationImportController extends Controller
{
    public function import(Request $request)
    {
        // 1. Enforce strict type safety and file constraints upfront
        $validated = $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls,csv'],
            'type' => ['required', 'in:internal,bank'],
            'date_issued' => ['required_if:type,internal', 'date'],
            'disbursement_week' => ['required_if:type,internal', 'integer', 'between:1,5'],
            'bank_date' => ['required_if:type,bank', 'date'],
        ]);

        $file = $validated['file'];
        $type = $validated['type'];
        $dateIssued = $validated['date_issued'] ?? null;
        $disbursementWeek = $validated['disbursement_week'] ?? null;
        $bankDate = $validated['bank_date'] ?? null;

        // 2. Isolate the spreadsheet resource to local disk storage
        $storedPath = $file->store('imports/bank-recon', 'local');

        // 3. Register the audit tracking record in the database
        $importJob = ImportJob::create([
            'user_id' => $request->user()?->id,
            'type' => 'bank_recon_' . $type, // bank_recon_internal or bank_recon_bank
            'status' => ImportJob::STATUS_QUEUED,
            'file_name' => $request->file('file')->getClientOriginalName(),
            'context' => [
                'file_path' => $storedPath,
                'target_type' => $type,
                'date_issued' => $dateIssued,
                'disbursement_week' => $disbursementWeek,
                'bank_date' => $bankDate,
            ],
        ]);

        // 4. Dispatch the job using light primitive data variables (No complex objects)
        ProcessBankReconImportJob::dispatch(
            $importJob->id,
            $type,
            $storedPath,
            $dateIssued,
            $disbursementWeek,
            $bankDate
        );

        // 5. Instantly return control back to your frontend React interface
        return back()
            ->with('success', 'Your ledger file has been successfully queued for background processing.')
            ->with('import_job_id', $importJob->id);
    }
}