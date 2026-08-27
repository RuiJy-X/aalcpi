<?php

namespace App\Jobs;

use App\Imports\BankStatementsImport;
use App\Imports\InternalDisbursementsImport;
use App\Models\ImportJob;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;
use Maatwebsite\Excel\Facades\Excel;
use Throwable;

class ProcessBankReconImportJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 1800;

    public int $tries = 1;

    public bool $failOnTimeout = true;

    protected $jobId;

    protected $type;

    protected $filePath;

    protected $dateIssued;

    protected $disbursementWeek;

    protected $bankDate;

    protected array $mapping;

    protected array $duplicateResolutions;

    public function __construct(
        int $jobId,
        string $type,
        string $filePath,
        ?string $dateIssued = null,
        ?int $disbursementWeek = null,
        ?string $bankDate = null,
        array $mapping = [],
        array $duplicateResolutions = []
    ) {
        $this->jobId = $jobId;
        $this->type = $type;
        $this->filePath = $filePath;
        $this->dateIssued = $dateIssued;
        $this->disbursementWeek = $disbursementWeek;
        $this->bankDate = $bankDate;
        $this->mapping = $mapping;
        $this->duplicateResolutions = $duplicateResolutions;
    }

    public function handle()
    {
        $importJob = ImportJob::find($this->jobId);
        $importJob?->markRunning();

        try {
            if ($this->type === 'bank') {
                Excel::import(
                    new BankStatementsImport(
                        $this->jobId,
                        $this->filePath,
                        $this->bankDate,
                        $this->mapping,
                        $this->duplicateResolutions
                    ),
                    $this->filePath,
                    'local'
                );
            } else {
                Excel::import(
                    new InternalDisbursementsImport(
                        $this->jobId,
                        $this->filePath,
                        (string) ($this->dateIssued ?? ''),
                        (int) ($this->disbursementWeek ?? 1),
                        $this->mapping,
                        $this->duplicateResolutions
                    ),
                    $this->filePath,
                    'local'
                );
            }

            // The importer's AfterImport event marks the job done already;
            // this only covers the (unlikely) case that event never fired.
            $importJob?->refresh();
            if ($importJob && $importJob->status === ImportJob::STATUS_RUNNING) {
                $importJob->markDone();
            }
        } catch (Throwable $e) {
            // Throwable, not just Exception — a malformed row can throw a
            // plain TypeError, which extends Error and slips straight past
            // catch(Exception), leaving the job stuck at "running" forever.
            $importJob?->markFailed($e->getMessage());

            throw $e;
        } finally {
            if (Storage::disk('local')->exists($this->filePath)) {
                Storage::disk('local')->delete($this->filePath);
            }
        }
    }

    public function failed(?Throwable $exception = null): void
    {
        $importJob = ImportJob::find($this->jobId);

        if ($importJob === null || $importJob->status === ImportJob::STATUS_DONE) {
            return;
        }

        $importJob->markFailed($exception?->getMessage() ?: 'Bank reconciliation import failed or timed out.');
    }
}
