<?php

namespace App\Jobs;

use App\Imports\AttendanceImport;
use App\Imports\PlanterImport;
use App\Imports\ProductionsImport;
use App\Models\ImportJob;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;
use Maatwebsite\Excel\Facades\Excel;
use RuntimeException;
use Throwable;

class ProcessExcelImportJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $timeout = 1800;

    /**
     * @param array<string, mixed> $options
     */
    public function __construct(
        public int $importJobId,
        public string $type,
        public string $path,
        public array $options = [],
    ) {
        $this->onQueue('default');
    }

    public function handle(): void
    {
        $importJob = ImportJob::find($this->importJobId);
        $importJob?->markRunning();

        try {
            $this->runImport();
            if (! $this->shouldDeferCompletion()) {
                $importJob?->markDone();
            }
        } catch (Throwable $exception) {
            $importJob?->markFailed($exception->getMessage());
            throw $exception;
        } finally {
            if (! $this->shouldDeferCompletion()) {
                Storage::disk('local')->delete($this->path);
            }
        }
    }

    private function shouldDeferCompletion(): bool
    {
        return $this->type === 'productions_excel';
    }

    private function runImport(): void
    {
        $fullPath = Storage::disk('local')->path($this->path);

        if (! is_file($fullPath)) {
            throw new RuntimeException('Import file not found for processing.');
        }

        switch ($this->type) {
            case 'planters_excel':
                Excel::import(
                    new PlanterImport($this->options['mapping'] ?? []),
                    $fullPath,
                );
                return;

            case 'productions_excel':
                $cropYear = (string) ($this->options['crop_year'] ?? '');
                if ($cropYear === '') {
                    throw new RuntimeException('Crop year is required for productions import.');
                }

                Excel::import(
                    new ProductionsImport(
                        $cropYear,
                        $this->options['mapping'] ?? [],
                        $this->options['composite_sugar_price'] ?? null,
                        $this->options['composite_molasses_price'] ?? null,
                        $this->importJobId,
                        $this->path,
                    ),
                    $fullPath,
                );
                return;

            case 'attendance_excel':
                $import = new AttendanceImport();
                Excel::import($import, $fullPath);

                if ($import->importedCount === 0) {
                    throw new RuntimeException('No attendance rows were imported for the selected employee and date range.');
                }
                return;

            default:
                throw new RuntimeException('Unsupported import type: ' . $this->type);
        }
    }
}
