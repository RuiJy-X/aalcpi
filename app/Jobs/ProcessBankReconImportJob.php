<?php

namespace App\Jobs;

use App\Models\ImportJob;
use App\Imports\InternalDisbursementsImport;
use App\Imports\BankStatementsImport;
use Maatwebsite\Excel\Facades\Excel;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Exception;

class ProcessBankReconImportJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $jobId;
    protected $type;
    protected $filePath;
    protected $dateIssued;
    protected $disbursementWeek;
    protected $bankDate;
    
    /**
     * Only accept strict primitive scalar parameters to avoid serialization failures.
     */
    public function __construct(
        int $jobId,
        string $type,
        string $filePath,
        ?string $dateIssued = null,
        ?int $disbursementWeek = null,
        ?string $bankDate = null
    ) {
        $this->jobId = $jobId;
        $this->type = $type;
        $this->filePath = $filePath;
        $this->dateIssued = $dateIssued;
        $this->disbursementWeek = $disbursementWeek;
        $this->bankDate = $bankDate;
    }

    public function handle()
    {
        // 1. Fetch the database tracking master stub and mark as processing
        $importJob = ImportJob::find($this->jobId);
        if ($importJob) {
            $importJob->update(['status' => 'processing']); // or your model constant
        }

        try {
            // 2. Select and run the appropriate parser using the local file path string
            if ($this->type === 'bank') {
                Excel::import(
                    new BankStatementsImport(
                        $this->jobId,
                        $this->filePath,
                        $this->bankDate
                    ),
                    $this->filePath,
                    'local'
                );
            } else {
                Excel::import(
                    new InternalDisbursementsImport(
                        $this->jobId,
                        $this->filePath,
                        $this->dateIssued,
                        $this->disbursementWeek,
                    ),
                    $this->filePath,
                    'local'
                );
            }

            // 3. Mark the transaction audit log as completed on structural success
            if ($importJob) {
                $importJob->update(['status' => 'done']);
            }

        } catch (Exception $e) {
            // 4. Catch failures gracefully and mark the tracking job state as failed
            if ($importJob) {
                $importJob->update([
                    'status' => 'failed',
                    'error_log' => $e->getMessage()
                ]);
            }

            throw $e; // Bubble up error for Laravel queue retry handling mechanisms
        }
    }
}