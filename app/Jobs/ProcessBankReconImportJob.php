<?php

namespace App\Jobs;

use App\Models\BankStatement;
use App\Models\ImportJob;
use App\Models\InternalDisbursements;
use App\Imports\InternalDisbursementsImport;
use App\Imports\BankStatementsImport;
use Maatwebsite\Excel\Facades\Excel;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;
use Throwable;

class ProcessBankReconImportJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $jobId;
    protected $type;
    protected $filePath;
    protected $dateIssued;
    protected $disbursementWeek;
    protected $bankDate;

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
        $importJob = ImportJob::find($this->jobId);
        $importJob?->markRunning();

        try {
            $this->replacePriorBatch();

            if ($this->type === 'bank') {
                Excel::import(
                    new BankStatementsImport($this->jobId, $this->filePath, $this->bankDate),
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

    /**
     * Re-importing the same file for the same batch (same date_issued +
     * disbursement_week for internal, same bank_date month for bank)
     * should replace that batch, not stack another 5,000 rows on top of
     * the last upload. Delete whatever already exists for this exact
     * batch key before the importer inserts anything new.
     */
    private function replacePriorBatch(): void
    {
        if ($this->type === 'bank') {
            if (!$this->bankDate) {
                return;
            }

            $existingIds = BankStatement::where('bank_date', $this->bankDate)->pluck('id');

            if ($existingIds->isEmpty()) {
                return;
            }

            // Detach internal disbursements pointing at bank rows we're
            // about to delete, so the delete doesn't leave dangling FKs.
            InternalDisbursements::whereIn('bank_statement_id', $existingIds)
                ->update(['bank_statement_id' => null]);

            BankStatement::whereIn('id', $existingIds)->delete();
        } else {
            if (!$this->dateIssued || !$this->disbursementWeek) {
                return;
            }

            InternalDisbursements::where('date_issued', $this->dateIssued)
                ->where('disbursement_week', $this->disbursementWeek)
                ->delete();
        }
    }
}