<?php

namespace App\Http\Controllers;

use App\Jobs\ProcessWeeklyImportJob;
use App\Models\ImportJob;
use App\Models\Weekly;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class WeeklyController extends Controller
{
    public function index(): Response
    {
        $weeklies = Weekly::query()
            ->orderByDesc('crop_year')
            ->orderByDesc('week')
            ->orderBy('planter_name')
            ->orderBy('page')
            ->get()
            ->map(function (Weekly $weekly): array {
                return [
                    'id' => $weekly->id,
                    'crop_year' => $weekly->crop_year,
                    'week' => $weekly->week,
                    'planter_name' => $weekly->planter_name,
                    'planter_code' => $weekly->planter_code,
                    'segment' => $weekly->segment,
                    'page' => $weekly->page,
                    'file_location' => $weekly->file_location,
                    'preview_url' => route('weekly.show', $weekly),
                    'download_url' => route('weekly.download', $weekly),
                    'created_at' => $weekly->created_at?->toIso8601String(),
                ];
            })
            ->values();

        $cropYears = $weeklies
            ->pluck('crop_year')
            ->filter()
            ->unique()
            ->sortDesc()
            ->values();

        $weeksByCropYear = $weeklies
            ->groupBy('crop_year')
            ->map(fn (Collection $items) => $items->pluck('week')->filter()->unique()->sort()->values()->all())
            ->toArray();

        return Inertia::render('Weekly/Index', [
            'weeklies' => $weeklies,
            'crop_years' => $cropYears,
            'weeks_by_crop_year' => $weeksByCropYear,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'file' => ['required', 'file', 'mimes:pdf', 'max:51200'],
            'week' => ['required', 'string', 'max:50'],
            'crop_year' => ['required', 'string', 'max:50'],
        ]);

        $uploadedFile = $request->file('file');

        if ($uploadedFile === null) {
            throw new RuntimeException('A PDF file is required.');
        }

        $week = trim((string) $validated['week']);
        $cropYear = trim((string) $validated['crop_year']);
        $temporaryPath = $uploadedFile->store('weekly-imports', 'local');

        $importJob = ImportJob::create([
            'user_id' => $request->user()?->id,
            'type' => 'weekly_pdf',
            'status' => ImportJob::STATUS_QUEUED,
            'context' => [
                'week' => $week,
                'crop_year' => $cropYear,
            ],
        ]);
        // Avoid blocking the current HTTP request when queue connection is sync.
        // This lets the user continue navigating while import processing runs.
        ProcessWeeklyImportJob::dispatch($temporaryPath, $week, $cropYear, $importJob->id);

        return redirect()
            ->back()
            ->with('success', 'Weekly import queued. You can keep using the app while it processes.')
            ->with('import_job_id', $importJob->id);
    }

    public function clear(): RedirectResponse
    {
        Weekly::query()->delete();

        Storage::disk('public')->deleteDirectory('weekly-pdfs');
        Storage::disk('local')->deleteDirectory('weekly-imports');

        return redirect()->back()->with('success', 'Weekly data cleared successfully.');
    }

        public function destroyByCropYearWeek(Request $request): RedirectResponse
        {
            $validated = $request->validate([
                'crop_year' => ['required', 'string', 'max:50'],
                'week' => ['required', 'string', 'max:50'],
            ]);

            $cropYear = trim((string) $validated['crop_year']);
            $week = trim((string) $validated['week']);

            $weeklies = Weekly::query()
                ->where('crop_year', $cropYear)
                ->where('week', $week)
                ->get(['file_location']);

            $fileLocations = $weeklies
                ->pluck('file_location')
                ->filter()
                ->values()
                ->all();

            if (! empty($fileLocations)) {
                Storage::disk('public')->delete($fileLocations);
            }

            $deleted = Weekly::query()
                ->where('crop_year', $cropYear)
                ->where('week', $week)
                ->delete();

            $relativeOutputDirectory = 'weekly-pdfs/' . Str::slug($cropYear) . '/week-' . Str::slug($week);
            Storage::disk('public')->deleteDirectory($relativeOutputDirectory);

            return redirect()
                ->back()
                ->with('success', "Deleted {$deleted} weekly records for crop year {$cropYear} week {$week}.");
        }
    public function show(Weekly $weekly)
    {
        abort_unless(Storage::disk('public')->exists($weekly->file_location), 404);

        return response()->file(Storage::disk('public')->path($weekly->file_location));
    }

    public function download(Weekly $weekly)
    {
        abort_unless(Storage::disk('public')->exists($weekly->file_location), 404);

        return response()->download(
            Storage::disk('public')->path($weekly->file_location),
            basename($weekly->file_location),
        );
    }
}
