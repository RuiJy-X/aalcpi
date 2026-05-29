import { router } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { index as weeklyIndex } from '@/routes/weekly';
import type { WeeklyPlanterGroup, WeeklyRecord } from '../types';
import { sortNumericStrings } from '../utils';

export function useWeeklyFilters({
    weeklies,
    weeksByCropYear,
    pagination,
    tableState,
}: {
    weeklies: WeeklyRecord[];
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

    const groupedWeeklies = useMemo<WeeklyPlanterGroup[]>(() => {
        const groups = new Map<
            string,
            {
                planter_code: string;
                planter_name: string;
                crop_years: Set<string>;
                weeks: Set<string>;
                files: WeeklyRecord[];
            }
        >();

        weeklies.forEach((item) => {
            const key = `${item.planter_code}::${item.planter_name}`;
            const existingGroup = groups.get(key);

            if (existingGroup) {
                existingGroup.crop_years.add(item.crop_year);
                existingGroup.weeks.add(item.week);
                existingGroup.files.push(item);
                return;
            }

            groups.set(key, {
                planter_code: item.planter_code,
                planter_name: item.planter_name,
                crop_years: new Set([item.crop_year]),
                weeks: new Set([item.week]),
                files: [item],
            });
        });

        return Array.from(groups.values())
            .map((group) => ({
                planter_code: group.planter_code,
                planter_name: group.planter_name,
                crop_years: sortNumericStrings(Array.from(group.crop_years)),
                weeks: sortNumericStrings(Array.from(group.weeks)),
                files: group.files.sort((left, right) => {
                    const weekCompare = Number(left.week) - Number(right.week);

                    if (weekCompare !== 0) {
                        return weekCompare;
                    }

                    const pageCompare = Number(left.page) - Number(right.page);

                    if (pageCompare !== 0) {
                        return pageCompare;
                    }

                    return left.segment.localeCompare(
                        right.segment,
                        undefined,
                        {
                            numeric: true,
                            sensitivity: 'base',
                        },
                    );
                }),
            }))
            .sort((left, right) =>
                left.planter_name.localeCompare(right.planter_name),
            );
    }, [weeklies]);

    const selectedItems = useMemo(
        () => weeklies.filter((item) => selectedIds.includes(item.id)),
        [weeklies, selectedIds],
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
    const paginatedGroups = groupedWeeklies;

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

    const toggleSelection = (item: WeeklyRecord, checked: boolean) => {
        setSelectedIds((current) =>
            checked
                ? Array.from(new Set([...current, item.id]))
                : current.filter((id) => id !== item.id),
        );

        if (checked) {
            setPreviewId(item.id);
        } else if (previewId === item.id) {
            setPreviewId(null);
        }
    };

    const openPreview = (item: WeeklyRecord) => {
        setSelectedIds((current) =>
            current.includes(item.id) ? current : [...current, item.id],
        );
        setPreviewId(item.id);
    };

    const clearSelection = () => {
        setSelectedIds([]);
        setPreviewId(null);
    };

    const buildQuery = (page: number) => {
        const query: Record<string, string | number> = {
            page,
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

        return query;
    };

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        const timeoutId = window.setTimeout(() => {
            router.get(weeklyIndex().url, buildQuery(1), {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        }, 250);

        return () => window.clearTimeout(timeoutId);
    }, [search, selectedCropYear, selectedWeek]);

    const setCurrentPage = (page: number) => {
        router.get(weeklyIndex().url, buildQuery(page), {
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
        selectedIds,
        currentPage,
        setCurrentPage,
        weekOptions,
        groupedWeeklies,
        paginatedGroups,
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
