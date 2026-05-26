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

    public int $timeout = 1800;

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
            ? ['py', '-3', base_path('pdftoexcel.py'), $inputPath, $week, $cropYear, $outputPath]
            : ['python3', base_path('pdftoexcel.py'), $inputPath, $week, $cropYear, $outputPath];

        try {
            try {
                $process = Process::timeout(1200)->run($processCommand);

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

                Weekly::query()
                    ->where('crop_year', $cropYear)
                    ->where('week', $week)
                    ->delete();

                $publicRoot = Str::of(realpath(storage_path('app/public')) ?: storage_path('app/public'))
                    ->replace('\\', '/')
                    ->trim('/');

                $files->each(function (array $file) use ($cropYear, $week, $publicRoot): void {
                    $outputFile = Str::of((string) ($file['output_file'] ?? ''))
                        ->replace('\\', '/')
                        ->trim();

                    if ($outputFile->isEmpty()) {
                        return;
                    }

                    $relativePath = $outputFile->startsWith($publicRoot . '/')
                        ? $outputFile->after($publicRoot . '/')
                        : $outputFile->after('storage/app/public/');

                    $relativePath = $relativePath->toString();

                    if ($relativePath === '') {
                        return;
                    }

                    $planterCode = trim((string) ($file['planter_code'] ?? 'UNKNOWN'));
                    $planterName = trim((string) ($file['planter_name'] ?? 'UNKNOWN PLANTER'));
                    $segment = trim((string) ($file['segment'] ?? 'full'));
                    $page = trim((string) ($file['source_page'] ?? $file['page'] ?? ''));

                    // Use a stable, natural reference key so one source page can map to
                    // multiple planter rows without collisions and without duplicate inserts.
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
                        ],
                    );
                });
            } finally {
                Storage::disk('local')->delete($this->temporaryPath);
            }

            $importJob?->markDone();
        } catch (Throwable $exception) {
            $importJob?->markFailed($exception->getMessage());
            throw $exception;
        }
    }
}
