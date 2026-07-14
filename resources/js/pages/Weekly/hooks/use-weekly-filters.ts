import { router } from '@inertiajs/react';
import { format } from 'date-fns';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { DateRange } from 'react-day-picker';

import { index as weeklyIndex } from '@/routes/weekly';
import type { WeeklyPlanterGroup, WeeklyRecord } from '../types';
import { sortNumericStrings } from '../utils';

export function useWeeklyFilters({
    planterGroups,
    weeksByCropYear,
    pagination,
    tableState,
}: {
    planterGroups: WeeklyPlanterGroup[];
    weeksByCropYear: Record<string, string[]>;
    pagination: {
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
        const allValues = Object.values(weeksByCropYear).flat();
        return sortNumericStrings(Array.from(new Set(allValues)));
    }, [weeksByCropYear]);

    const weekOptions =
        selectedCropYear === 'all'
            ? allWeeks
            : sortNumericStrings(weeksByCropYear[selectedCropYear] ?? []);

    // Server already paginated by planter and attached full file lists.
    const groupedWeeklies = planterGroups;

    const allFiles = useMemo(
        () => planterGroups.flatMap((group) => group.files),
        [planterGroups],
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

    const totalPages = pagination.last_page;
    const currentPage = pagination.current_page;

    const handleCropYearChange = (value: string) => {
        setSelectedCropYear(value);

        if (value === 'all') {
            setSelectedWeek('all');
            return;
        }

        const allowedWeeks = weeksByCropYear[value] ?? [];

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
            per_page: pagination.per_page,
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
        pagination,
        previewItem,
        previewTitle,
        handleCropYearChange,
        setSelectedWeek,
        toggleSelection,
        openPreview,
        clearSelection,
    };
}
