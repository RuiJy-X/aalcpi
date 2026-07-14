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
        // Paginate planters (not individual PDF rows) so expanding a planter
        // always shows that planter's complete filtered file list.
        $perPage = min(max(1, $request->integer('per_page', 10)), 100);
        $page = max(1, $request->integer('page', 1));
        $search = $request->string('search')->toString();

        $filteredQuery = $this->buildWeeklyFilterQuery(
            $selectedCropYear,
            $selectedWeek,
            $periodFrom,
            $periodTo,
            $search,
        );

        // Distinct planters matching the filters, ordered for stable paging.
        $planterKeys = (clone $filteredQuery)
            ->select(['planter_code', 'planter_name'])
            ->distinct()
            ->orderBy('planter_name')
            ->orderBy('planter_code')
            ->get();

        $totalPlanters = $planterKeys->count();
        $lastPage = max(1, (int) ceil($totalPlanters / $perPage));
        $page = min($page, $lastPage);
        $pagePlanters = $planterKeys->forPage($page, $perPage)->values();

        $planterGroups = $this->buildPlanterGroups(
            $filteredQuery,
            $pagePlanters,
            $selectedCropYear,
            $periodFrom,
            $periodTo,
        );

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
            'planter_groups' => $planterGroups,
            'crop_years' => $cropYears,
            'weeks_by_crop_year' => $weeksByCropYear,
            'pagination' => [
                'total' => $totalPlanters,
                'per_page' => $perPage,
                'current_page' => $page,
                'last_page' => $lastPage,
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

    /**
     * Shared filter builder for weekly list queries.
     *
     * @return \Illuminate\Database\Eloquent\Builder<Weekly>
     */
    private function buildWeeklyFilterQuery(
        string $selectedCropYear,
        string $selectedWeek,
        string $periodFrom,
        string $periodTo,
        string $search,
    ) {
        $driver = Schema::getConnection()->getDriverName();
        $likeOperator = $driver === 'pgsql' ? 'ilike' : 'like';
        $useCaseInsensitiveLike = $driver === 'sqlite';
        $applyLike = function ($query, string $column, string $value, string $boolean = 'and') use ($likeOperator, $useCaseInsensitiveLike) {
            if ($useCaseInsensitiveLike) {
                $grammar = method_exists($query, 'getQuery') ? $query->getQuery()->getGrammar() : $query->getGrammar();
                $wrapped = $grammar->wrap($column);
                $query->whereRaw('lower('.$wrapped.') like ?', [strtolower($value)], $boolean);

                return;
            }

            $query->where($column, $likeOperator, $value, $boolean);
        };

        $query = Weekly::query();

        if ($selectedCropYear !== '' && $selectedCropYear !== 'all') {
            $query->where('crop_year', $selectedCropYear);
        }

        if ($selectedWeek !== '' && $selectedWeek !== 'all') {
            $query->where('week', $selectedWeek);
        }

        if ($periodFrom !== '') {
            $periodEnd = $periodTo !== '' ? $periodTo : $periodFrom;
            $query->whereBetween('created_at', [$periodFrom, $periodEnd.' 23:59:59']);
        }

        if ($search !== '') {
            $like = '%'.$search.'%';
            $query->where(function ($inner) use ($applyLike, $like) {
                $applyLike($inner, 'planter_code', $like, 'or');
                $applyLike($inner, 'planter_name', $like, 'or');
                $applyLike($inner, 'crop_year', $like, 'or');
                $applyLike($inner, 'week', $like, 'or');
                $applyLike($inner, 'page', $like, 'or');
                $applyLike($inner, 'segment', $like, 'or');
            });
        }

        return $query;
    }

    /**
     * Load every filtered PDF for the planters on the current page, plus
     * full week/crop-year coverage (not limited by the week filter).
     *
     * @param  \Illuminate\Database\Eloquent\Builder<Weekly>  $filteredQuery
     * @param  Collection<int, Weekly|object>  $pagePlanters
     * @return list<array{
     *     planter_code: string,
     *     planter_name: string,
     *     crop_years: list<string>,
     *     weeks: list<string>,
     *     files: list<array<string, mixed>>,
     *     file_count: int
     * }>
     */
    private function buildPlanterGroups(
        $filteredQuery,
        Collection $pagePlanters,
        string $selectedCropYear,
        string $periodFrom,
        string $periodTo,
    ): array {
        if ($pagePlanters->isEmpty()) {
            return [];
        }

        $files = (clone $filteredQuery)
            ->where(function ($query) use ($pagePlanters) {
                foreach ($pagePlanters as $planter) {
                    $query->orWhere(function ($pair) use ($planter) {
                        $pair->where('planter_code', $planter->planter_code)
                            ->where('planter_name', $planter->planter_name);
                    });
                }
            })
            ->orderBy('planter_name')
            ->orderBy('planter_code')
            ->orderBy('crop_year')
            ->orderBy('week')
            ->orderBy('page')
            ->orderBy('segment')
            ->get();

        // Coverage ignores the week filter so the header always lists every
        // week this planter has, even when the user filters to a single week.
        $coverageQuery = Weekly::query()->where(function ($query) use ($pagePlanters) {
            foreach ($pagePlanters as $planter) {
                $query->orWhere(function ($pair) use ($planter) {
                    $pair->where('planter_code', $planter->planter_code)
                        ->where('planter_name', $planter->planter_name);
                });
            }
        });

        if ($selectedCropYear !== '' && $selectedCropYear !== 'all') {
            $coverageQuery->where('crop_year', $selectedCropYear);
        }

        if ($periodFrom !== '') {
            $periodEnd = $periodTo !== '' ? $periodTo : $periodFrom;
            $coverageQuery->whereBetween('created_at', [$periodFrom, $periodEnd.' 23:59:59']);
        }

        $coverageRows = $coverageQuery
            ->select(['planter_code', 'planter_name', 'week', 'crop_year'])
            ->get();

        $coverageByKey = [];
        foreach ($coverageRows as $row) {
            $key = $row->planter_code.'::'.$row->planter_name;
            if (! isset($coverageByKey[$key])) {
                $coverageByKey[$key] = [
                    'weeks' => [],
                    'crop_years' => [],
                ];
            }
            if ($row->week !== null && $row->week !== '' && ! in_array((string) $row->week, $coverageByKey[$key]['weeks'], true)) {
                $coverageByKey[$key]['weeks'][] = (string) $row->week;
            }
            if ($row->crop_year !== null && $row->crop_year !== '' && ! in_array((string) $row->crop_year, $coverageByKey[$key]['crop_years'], true)) {
                $coverageByKey[$key]['crop_years'][] = (string) $row->crop_year;
            }
        }

        $filesByKey = $files->groupBy(
            fn (Weekly $weekly): string => $weekly->planter_code.'::'.$weekly->planter_name
        );

        $groups = [];

        foreach ($pagePlanters as $planter) {
            $key = $planter->planter_code.'::'.$planter->planter_name;
            /** @var Collection<int, Weekly> $planterFiles */
            $planterFiles = $filesByKey->get($key, collect());

            $sortedFiles = $planterFiles
                ->sort(function (Weekly $left, Weekly $right): int {
                    $weekCompare = $this->compareNumericStrings((string) $left->week, (string) $right->week);
                    if ($weekCompare !== 0) {
                        return $weekCompare;
                    }

                    $cropCompare = $this->compareNumericStrings((string) $left->crop_year, (string) $right->crop_year);
                    if ($cropCompare !== 0) {
                        return $cropCompare;
                    }

                    $pageCompare = $this->compareNumericStrings((string) $left->page, (string) $right->page);
                    if ($pageCompare !== 0) {
                        return $pageCompare;
                    }

                    return strnatcasecmp((string) $left->segment, (string) $right->segment);
                })
                ->values();

            $mappedFiles = $sortedFiles
                ->map(fn (Weekly $weekly): array => $this->mapWeeklyRecord($weekly))
                ->all();

            $coverage = $coverageByKey[$key] ?? ['weeks' => [], 'crop_years' => []];

            // If a week filter is active, coverage may still be broader; fall
            // back to weeks present in the loaded files when coverage is empty.
            $weeks = $coverage['weeks'] !== []
                ? $this->sortNumericStrings($coverage['weeks'])
                : $this->sortNumericStrings(
                    $sortedFiles->pluck('week')->map(fn ($w) => (string) $w)->unique()->values()->all()
                );

            $cropYears = $coverage['crop_years'] !== []
                ? $this->sortNumericStrings($coverage['crop_years'])
                : $this->sortNumericStrings(
                    $sortedFiles->pluck('crop_year')->map(fn ($y) => (string) $y)->unique()->values()->all()
                );

            $groups[] = [
                'planter_code' => (string) $planter->planter_code,
                'planter_name' => (string) $planter->planter_name,
                'crop_years' => $cropYears,
                'weeks' => $weeks,
                'files' => $mappedFiles,
                'file_count' => count($mappedFiles),
            ];
        }

        return $groups;
    }

    /**
     * @return array<string, mixed>
     */
    private function mapWeeklyRecord(Weekly $weekly): array
    {
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
    }

    /**
     * @param  list<string>  $values
     * @return list<string>
     */
    private function sortNumericStrings(array $values): array
    {
        usort($values, fn (string $left, string $right): int => $this->compareNumericStrings($left, $right));

        return array_values($values);
    }

    private function compareNumericStrings(string $left, string $right): int
    {
        if (is_numeric($left) && is_numeric($right)) {
            return (float) $left <=> (float) $right;
        }

        return strnatcasecmp($left, $right);
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
