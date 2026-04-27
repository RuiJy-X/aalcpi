import { useEffect, useMemo, useState } from 'react';

import type { WeeklyPlanterGroup, WeeklyRecord } from '../types';
import { sortNumericStrings } from '../utils';

const ITEMS_PER_PAGE = 10;

export function useWeeklyFilters({
    weeklies,
    weeksByCropYear,
}: {
    weeklies: WeeklyRecord[];
    weeksByCropYear: Record<string, string[]>;
}) {
    const [search, setSearch] = useState('');
    const [selectedCropYear, setSelectedCropYear] = useState('all');
    const [selectedWeek, setSelectedWeek] = useState('all');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [previewId, setPreviewId] = useState<number | null>(null);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        setCurrentPage(1);
    }, [search, selectedCropYear, selectedWeek]);

    const allWeeks = useMemo(
        () => sortNumericStrings(weeklies.map((item) => item.week)),
        [weeklies],
    );

    const weekOptions =
        selectedCropYear === 'all'
            ? allWeeks
            : sortNumericStrings(weeksByCropYear[selectedCropYear] ?? []);

    const filteredWeeklies = useMemo(() => {
        const needle = search.trim().toLowerCase();

        return weeklies.filter((item) => {
            const matchesSearch =
                needle === '' ||
                [
                    item.planter_code,
                    item.planter_name,
                    item.crop_year,
                    item.week,
                    item.page,
                    item.segment,
                ]
                    .join(' ')
                    .toLowerCase()
                    .includes(needle);

            const matchesCropYear =
                selectedCropYear === 'all' ||
                item.crop_year === selectedCropYear;
            const matchesWeek =
                selectedWeek === 'all' || item.week === selectedWeek;

            return matchesSearch && matchesCropYear && matchesWeek;
        });
    }, [search, selectedCropYear, selectedWeek, weeklies]);

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

        filteredWeeklies.forEach((item) => {
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
    }, [filteredWeeklies]);

    const selectedItems = useMemo(
        () => filteredWeeklies.filter((item) => selectedIds.includes(item.id)),
        [filteredWeeklies, selectedIds],
    );

    const previewItem =
        selectedItems.find((item) => item.id === previewId) ??
        selectedItems[0] ??
        null;

    const previewTitle = previewItem
        ? `${previewItem.planter_name} - Week ${previewItem.week}`
        : 'Select a weekly PDF to preview it here';

    const totalPages = Math.ceil(groupedWeeklies.length / ITEMS_PER_PAGE);

    const paginatedGroups = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return groupedWeeklies.slice(start, start + ITEMS_PER_PAGE);
    }, [groupedWeeklies, currentPage]);

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
        previewItem,
        previewTitle,
        handleCropYearChange,
        setSelectedWeek,
        toggleSelection,
        openPreview,
        clearSelection,
    };
}
