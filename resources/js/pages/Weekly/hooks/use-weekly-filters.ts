import { router } from '@inertiajs/react';
import { format } from 'date-fns';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { DateRange } from 'react-day-picker';

import { index as weeklyIndex } from '@/routes/weekly';
import type { WeeklyPlanterGroup, WeeklyRecord } from '../types';
import { sortNumericStrings } from '../utils';

export function useWeeklyFilters({
    planterGroups = [],
    weeksByCropYear = {},
    pagination = {
        total: 0,
        per_page: 10,
        current_page: 1,
        last_page: 1,
    },
    tableState,
}: {
    planterGroups?: WeeklyPlanterGroup[];
    weeksByCropYear?: Record<string, string[]>;
    pagination?: {
        total: number;
        per_page: number;
        current_page: number;
        last_page: number;
    };
    tableState?: {
        search?: string;
        crop_year?: string;
        week?: string;
        period_from?: string;
        period_to?: string;
    };
}) {
    // Guard against partial Inertia props / HMR so the page never white-screens.
    const safePlanterGroups = planterGroups ?? [];
    const safeWeeksByCropYear = weeksByCropYear ?? {};
    const safePagination = {
        total: pagination?.total ?? 0,
        per_page: pagination?.per_page ?? 10,
        current_page: pagination?.current_page ?? 1,
        last_page: pagination?.last_page ?? 1,
    };
    const [search, setSearch] = useState(tableState?.search ?? '');
    const [selectedCropYear, setSelectedCropYear] = useState(
        tableState?.crop_year && tableState.crop_year !== ''
            ? tableState.crop_year
            : 'all',
    );
    const [selectedWeek, setSelectedWeek] = useState(
        tableState?.week && tableState.week !== '' ? tableState.week : 'all',
    );
    const [periodRange, setPeriodRange] = useState<DateRange | undefined>(
        tableState?.period_from
            ? {
                  from: new Date(tableState.period_from),
                  to: tableState.period_to
                      ? new Date(tableState.period_to)
                      : undefined,
              }
            : undefined,
    );
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [previewId, setPreviewId] = useState<number | null>(null);
    const isFirstRender = useRef(true);

    const allWeeks = useMemo(() => {
        const allValues = Object.values(safeWeeksByCropYear).flat();
        return sortNumericStrings(Array.from(new Set(allValues)));
    }, [safeWeeksByCropYear]);

    const weekOptions =
        selectedCropYear === 'all'
            ? allWeeks
            : sortNumericStrings(safeWeeksByCropYear[selectedCropYear] ?? []);

    // Server already paginated by planter and attached full file lists.
    const groupedWeeklies = safePlanterGroups;

    const allFiles = useMemo(
        () => safePlanterGroups.flatMap((group) => group.files ?? []),
        [safePlanterGroups],
    );

    const selectedItems = useMemo(
        () => allFiles.filter((item) => selectedIds.includes(item.id)),
        [allFiles, selectedIds],
    );

    const previewItem =
        selectedItems.find((item) => item.id === previewId) ??
        selectedItems[0] ??
        null;

    const previewTitle = previewItem
        ? `${previewItem.planter_name} - Week ${previewItem.week}`
        : 'Select a weekly PDF to preview it here';

    const totalPages = safePagination.last_page;
    const currentPage = safePagination.current_page;

    const handleCropYearChange = (value: string) => {
        setSelectedCropYear(value);

        if (value === 'all') {
            setSelectedWeek('all');
            return;
        }

        const allowedWeeks = safeWeeksByCropYear[value] ?? [];

        if (selectedWeek !== 'all' && !allowedWeeks.includes(selectedWeek)) {
            setSelectedWeek('all');
        }
    };

    // Only one weekly file row can be active at a time.
    const toggleSelection = (item: WeeklyRecord, checked: boolean) => {
        if (checked) {
            setSelectedIds([item.id]);
            setPreviewId(item.id);
            return;
        }

        setSelectedIds([]);
        setPreviewId(null);
    };

    const openPreview = (item: WeeklyRecord) => {
        setSelectedIds([item.id]);
        setPreviewId(item.id);
    };

    const clearSelection = () => {
        setSelectedIds([]);
        setPreviewId(null);
    };

    const buildQuery = (
        nextPage: number,
        period: DateRange | undefined = periodRange,
    ) => {
        const query: Record<string, string | number> = {
            page: nextPage,
            per_page: safePagination.per_page,
        };

        if (search.trim() !== '') {
            query.search = search.trim();
        }

        if (selectedCropYear !== 'all') {
            query.crop_year = selectedCropYear;
        }

        if (selectedWeek !== 'all') {
            query.week = selectedWeek;
        }

        if (period?.from) {
            query.period_from = format(period.from, 'yyyy-MM-dd');
            if (period.to) {
                query.period_to = format(period.to, 'yyyy-MM-dd');
            }
        }

        return query;
    };

    const applyPeriodFilter = (nextPeriod: DateRange | undefined) => {
        setPeriodRange(nextPeriod);
        clearSelection();
        router.get(weeklyIndex().url, buildQuery(1, nextPeriod), {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        const timeoutId = window.setTimeout(() => {
            clearSelection();
            router.get(weeklyIndex().url, buildQuery(1), {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        }, 250);

        return () => window.clearTimeout(timeoutId);
    }, [search, selectedCropYear, selectedWeek]);

    const setCurrentPage = (nextPage: number) => {
        clearSelection();
        router.get(weeklyIndex().url, buildQuery(nextPage), {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    return {
        search,
        setSearch,
        selectedCropYear,
        selectedWeek,
        periodRange,
        applyPeriodFilter,
        selectedIds,
        currentPage,
        setCurrentPage,
        weekOptions,
        groupedWeeklies,
        totalPages,
        pagination: safePagination,
        previewItem,
        previewTitle,
        handleCropYearChange,
        setSelectedWeek,
        toggleSelection,
        openPreview,
        clearSelection,
    };
}
