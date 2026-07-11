<?php

namespace App\Http\Controllers;

use App\Jobs\ProcessWeeklyImportJob;
use App\Models\ImportJob;
use App\Models\Weekly;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class WeeklyController extends Controller
{
    public function index(Request $request): Response
    {
        $selectedCropYear = $request->string('crop_year')->toString();
        $selectedWeek = $request->string('week')->toString();
        $periodFrom = $request->string('period_from')->toString();
        $periodTo = $request->string('period_to')->toString();
        $perPage = min(max(1, $request->integer('per_page', 10)), 100);
        $search = $request->string('search')->toString();
        $driver = Schema::getConnection()->getDriverName();
        $likeOperator = $driver === 'pgsql' ? 'ilike' : 'like';
        $useCaseInsensitiveLike = $driver === 'sqlite';
        $applyLike = function ($query, string $column, string $value, string $boolean = 'and') use ($likeOperator, $useCaseInsensitiveLike) {
            if ($useCaseInsensitiveLike) {
                $grammar = method_exists($query, 'getQuery') ? $query->getQuery()->getGrammar() : $query->getGrammar();
                $wrapped = $grammar->wrap($column);
                $query->whereRaw('lower(' . $wrapped . ') like ?', [strtolower($value)], $boolean);

                return;
            }

            $query->where($column, $likeOperator, $value, $boolean);
        };

        $baseQuery = Weekly::query();

        if ($selectedCropYear !== '' && $selectedCropYear !== 'all') {
            $baseQuery->where('crop_year', $selectedCropYear);
        }

        if ($selectedWeek !== '' && $selectedWeek !== 'all') {
            $baseQuery->where('week', $selectedWeek);
        }

        if ($periodFrom !== '') {
            $periodEnd = $periodTo !== '' ? $periodTo : $periodFrom;
            $baseQuery->whereBetween('created_at', [$periodFrom, $periodEnd.' 23:59:59']);
        }

        if ($search !== '') {
            $like = '%' . $search . '%';
            $baseQuery->where(function ($query) use ($applyLike, $like) {
                $applyLike($query, 'planter_code', $like, 'or');
                $applyLike($query, 'planter_name', $like, 'or');
                $applyLike($query, 'crop_year', $like, 'or');
                $applyLike($query, 'week', $like, 'or');
                $applyLike($query, 'page', $like, 'or');
                $applyLike($query, 'segment', $like, 'or');
            });
        }

        $baseQuery
            ->orderByDesc('crop_year')
            ->orderByDesc('week')
            ->orderBy('planter_name')
            ->orderBy('page');

        $paginatedWeeklies = $baseQuery->paginate($perPage)->withQueryString();

        $weeklies = $paginatedWeeklies
            ->getCollection()
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

        $cropYears = Weekly::query()
            ->select('crop_year')
            ->whereNotNull('crop_year')
            ->distinct()
            ->orderByDesc('crop_year')
            ->pluck('crop_year')
            ->values();

        $weeksByCropYear = Weekly::query()
            ->select(['crop_year', 'week'])
            ->whereNotNull('crop_year')
            ->whereNotNull('week')
            ->distinct()
            ->orderBy('week')
            ->get()
            ->groupBy('crop_year')
            ->map(fn (Collection $items) => $items->pluck('week')->values()->all())
            ->toArray();

        $statsQuery = Weekly::query();
        if ($selectedCropYear !== '' && $selectedCropYear !== 'all') {
            $statsQuery->where('crop_year', $selectedCropYear);
        }
        if ($selectedWeek !== '' && $selectedWeek !== 'all') {
            $statsQuery->where('week', $selectedWeek);
        }
        if ($periodFrom !== '') {
            $periodEnd = $periodTo !== '' ? $periodTo : $periodFrom;
            $statsQuery->whereBetween('created_at', [$periodFrom, $periodEnd.' 23:59:59']);
        }

        $stats = [
            'totalDocuments' => (clone $statsQuery)->count(),
            'uniquePlanters' => (int) (clone $statsQuery)
                ->whereNotNull('planter_code')
                ->where('planter_code', '!=', '')
                ->distinct()
                ->count('planter_code'),
            'uniqueWeeks' => (int) (clone $statsQuery)
                ->whereNotNull('week')
                ->distinct()
                ->count('week'),
            'uniqueCropYears' => (int) (clone $statsQuery)
                ->whereNotNull('crop_year')
                ->distinct()
                ->count('crop_year'),
        ];

        return Inertia::render('Weekly/Index', [
            'weeklies' => $weeklies,
            'crop_years' => $cropYears,
            'weeks_by_crop_year' => $weeksByCropYear,
            'pagination' => [
                'total' => $paginatedWeeklies->total(),
                'per_page' => $paginatedWeeklies->perPage(),
                'current_page' => $paginatedWeeklies->currentPage(),
                'last_page' => $paginatedWeeklies->lastPage(),
            ],
            'table_state' => [
                'search' => $search,
                'crop_year' => $selectedCropYear,
                'week' => $selectedWeek,
                'period_from' => $periodFrom,
                'period_to' => $periodTo,
            ],
            'stats' => $stats,
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
