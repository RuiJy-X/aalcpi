<?php

use App\Jobs\ProcessWeeklyImportJob;
use App\Models\Weekly;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Storage;

it('assigns shared source page records to multiple planters without collisions', function () {
    $temporaryPath = 'weekly-imports/input.pdf';
    Storage::disk('local')->put($temporaryPath, 'fake pdf content');

    $outputPath = storage_path('app/public/weekly-pdfs/2025-2026/week-1/shared-page.pdf');

    Process::fake([
        '*' => Process::result(json_encode([
            'ok' => true,
            'processed_count' => 3,
            'files' => [
                [
                    'source_page' => 12,
                    'segment' => 'full',
                    'planter_code' => '1001',
                    'planter_name' => 'PLANter ONE',
                    'hacienda_code' => '2001',
                    'hacienda_address' => 'Address 1',
                    'output_file' => $outputPath,
                ],
                [
                    'source_page' => 12,
                    'segment' => 'full',
                    'planter_code' => '1002',
                    'planter_name' => 'Planter Two',
                    'hacienda_code' => '2002',
                    'hacienda_address' => 'Address 2',
                    'output_file' => $outputPath,
                ],
                // Duplicate row for planter 1001 should update the same record, not insert a third one.
                [
                    'source_page' => 12,
                    'segment' => 'full',
                    'planter_code' => '1001',
                    'planter_name' => 'PLANter ONE',
                    'hacienda_code' => '2001',
                    'hacienda_address' => 'Address 1',
                    'output_file' => $outputPath,
                ],
            ],
        ], JSON_THROW_ON_ERROR)),
    ]);

    (new ProcessWeeklyImportJob($temporaryPath, '1', '2025-2026'))->handle();

    expect(Weekly::query()->count())->toBe(2);

    $this->assertDatabaseHas('weeklies', [
        'crop_year' => '2025-2026',
        'week' => '1',
        'planter_code' => '1001',
        'planter_name' => 'PLANter ONE',
        'segment' => 'full',
        'page' => '12',
        'file_location' => 'weekly-pdfs/2025-2026/week-1/shared-page.pdf',
    ]);

    $this->assertDatabaseHas('weeklies', [
        'crop_year' => '2025-2026',
        'week' => '1',
        'planter_code' => '1002',
        'planter_name' => 'Planter Two',
        'segment' => 'full',
        'page' => '12',
        'file_location' => 'weekly-pdfs/2025-2026/week-1/shared-page.pdf',
    ]);

    expect(Storage::disk('local')->exists($temporaryPath))->toBeFalse();
});
