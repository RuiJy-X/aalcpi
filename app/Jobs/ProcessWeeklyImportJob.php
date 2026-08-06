<?php

namespace App\Jobs;

use App\Models\ImportJob;
use App\Models\Weekly;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use JsonException;
use RuntimeException;
use Throwable;

class ProcessWeeklyImportJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    /**
     * Large weekly PDFs can take many minutes to split.
     * queue:listen --timeout must be >= this value.
     */
    public int $timeout = 1800;

    /**
     * Do not retry after a hard timeout — partial PDF output would be messy.
     */
    public int $tries = 1;

    public bool $failOnTimeout = true;

    public function __construct(
        public string $temporaryPath,
        public string $week,
        public string $cropYear,
        public ?int $importJobId = null,
    ) {
        $this->onQueue('default');
    }

    public function handle(): void
    {
        $importJob = $this->importJobId ? ImportJob::find($this->importJobId) : null;
        $importJob?->markRunning();

        $week = trim($this->week);
        $cropYear = trim($this->cropYear);
        $relativeOutputDirectory = 'weekly-pdfs/' . Str::slug($cropYear) . '/week-' . Str::slug($week);
        $inputPath = Storage::disk('local')->path($this->temporaryPath);
        $outputPath = Storage::disk('public')->path($relativeOutputDirectory);

        Storage::disk('public')->deleteDirectory($relativeOutputDirectory);
        Storage::disk('public')->makeDirectory($relativeOutputDirectory);

        if (! is_file($inputPath)) {
            throw new RuntimeException('Weekly import PDF could not be staged for processing.');
        }

        $processCommand = PHP_OS_FAMILY === 'Windows'
            ? ['python', base_path('pdftoexcel.py'), $inputPath, $week, $cropYear, $outputPath]
            : ['python3', base_path('pdftoexcel.py'), $inputPath, $week, $cropYear, $outputPath];

        $importedCount = 0;
        $skippedCount = 0;
        $warnings = [];
        $uniquePlanterCodes = [];
        $extractedPlanters = [];

        try {
            try {
                $process = Process::timeout(1700)->run($processCommand);

                if (! $process->successful()) {
                    throw new RuntimeException(trim($process->errorOutput() ?: $process->output()) ?: 'Weekly PDF splitting failed.');
                }

                try {
                    $payload = json_decode($process->output(), true, 512, JSON_THROW_ON_ERROR);
                } catch (JsonException $exception) {
                    throw new RuntimeException('The weekly splitter returned invalid JSON: ' . $exception->getMessage());
                }

                $files = collect($payload['files'] ?? []);

                if ($files->isEmpty()) {
                    throw new RuntimeException('The weekly splitter did not return any output files.');
                }

                $deletedPriorCount = Weekly::query()
                    ->where('crop_year', $cropYear)
                    ->where('week', $week)
                    ->delete();

                if ($deletedPriorCount > 0) {
                    $warnings[] = "Replaced {$deletedPriorCount} existing weekly record(s) for Crop Year {$cropYear}, Week {$week}.";
                }

                $publicRoot = Str::of(realpath(storage_path('app/public')) ?: storage_path('app/public'))
                    ->replace('\\', '/')
                    ->trim('/');

                $files->each(function (array $file, int $index) use (
                    $cropYear,
                    $week,
                    $publicRoot,
                    &$importedCount,
                    &$skippedCount,
                    &$warnings,
                    &$uniquePlanterCodes,
                    &$extractedPlanters
                ): void {
                    $outputFile = Str::of((string) ($file['output_file'] ?? ''))
                        ->replace('\\', '/')
                        ->trim();

                    if ($outputFile->isEmpty()) {
                        $skippedCount++;
                        $warnings[] = "File entry #" . ($index + 1) . ": Output PDF file path was empty.";
                        return;
                    }

                    $relativePath = $outputFile->startsWith($publicRoot . '/')
                        ? $outputFile->after($publicRoot . '/')
                        : $outputFile->after('storage/app/public/');

                    $relativePath = $relativePath->toString();

                    if ($relativePath === '') {
                        $skippedCount++;
                        $warnings[] = "File entry #" . ($index + 1) . ": Could not determine relative output path.";
                        return;
                    }

                    $planterCode = trim((string) ($file['planter_code'] ?? 'UNKNOWN'));
                    $planterName = trim((string) ($file['planter_name'] ?? 'UNKNOWN PLANTER'));
                    $segment = trim((string) ($file['segment'] ?? 'full'));
                    $page = trim((string) ($file['source_page'] ?? $file['page'] ?? ''));

                    $uniquePlanterCodes[$planterCode] = true;
                    if (! in_array("{$planterCode} - {$planterName}", $extractedPlanters, true)) {
                        $extractedPlanters[] = "{$planterCode} - {$planterName}";
                    }

                    Weekly::updateOrCreate(
                        [
                            'crop_year' => $cropYear,
                            'week' => $week,
                            'planter_code' => $planterCode,
                            'planter_name' => $planterName,
                            'segment' => $segment,
                            'page' => $page,
                        ],
                        [
                            'file_location' => $relativePath,
                            'import_job_id' => $this->importJobId,
                        ],
                    );

                    $importedCount++;
                });
            } finally {
                Storage::disk('local')->delete($this->temporaryPath);
            }

            if ($importJob) {
                $context = array_merge($importJob->context ?? [], [
                    'heading_row' => 1,
                    'headers_read' => ['crop_year', 'week', 'planter_code', 'planter_name', 'segment', 'page', 'file_location'],
                    'rows_read' => $files->count(),
                    'rows_saved' => $importedCount,
                    'rows_skipped' => $skippedCount,
                    'unique_planters' => count($uniquePlanterCodes),
                    'extracted_planters' => array_slice($extractedPlanters, 0, 30),
                    'warnings' => $warnings,
                    'crop_year' => $cropYear,
                    'week' => $week,
                ]);

                $importJob->update([
                    'status' => ImportJob::STATUS_DONE,
                    'finished_at' => now(),
                    'context' => $context,
                    'message' => "Imported {$importedCount} weekly planter PDF(s) across " . count($uniquePlanterCodes) . " planter(s).",
                ]);
            }
        } catch (Throwable $exception) {
            if ($importJob) {
                $context = array_merge($importJob->context ?? [], [
                    'heading_row' => 1,
                    'rows_read' => isset($files) ? $files->count() : 0,
                    'rows_saved' => $importedCount,
                    'rows_skipped' => $skippedCount,
                    'warnings' => $warnings,
                    'error' => $exception->getMessage(),
                    'crop_year' => $cropYear,
                    'week' => $week,
                ]);

                $importJob->update([
                    'status' => ImportJob::STATUS_FAILED,
                    'finished_at' => now(),
                    'context' => $context,
                    'message' => $exception->getMessage(),
                ]);
            }
            throw $exception;
        }
    }

    /**
     * Called when the queue worker gives up (timeout, max attempts, uncaught throw).
     * Ensures the UI does not stay stuck on "running" forever.
     */
    public function failed(?Throwable $exception = null): void
    {
        if ($this->importJobId === null) {
            return;
        }

        $importJob = ImportJob::find($this->importJobId);

        if ($importJob === null || $importJob->status === ImportJob::STATUS_DONE) {
            return;
        }

        $message = $exception?->getMessage() ?: 'Weekly import failed or timed out.';

        if (str_contains(strtolower($message), 'timed out') || str_contains(strtolower($message), 'timeout')) {
            $message = 'Weekly import timed out while splitting the PDF. Re-run the import; large files can take several minutes.';
        }

        $context = array_merge($importJob->context ?? [], [
            'error' => $message,
            'crop_year' => $this->cropYear,
            'week' => $this->week,
        ]);

        $importJob->update([
            'status' => ImportJob::STATUS_FAILED,
            'finished_at' => now(),
            'context' => $context,
            'message' => $message,
        ]);

        // Best-effort cleanup of the staged upload.
        if ($this->temporaryPath !== '' && Storage::disk('local')->exists($this->temporaryPath)) {
            Storage::disk('local')->delete($this->temporaryPath);
        }
    }
}
