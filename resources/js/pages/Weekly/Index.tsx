import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

import {
    Container,
    ContainerHeader,
    ContainerHeaderEnd,
} from '@/components/container';
import { WeeklyImportDialog } from '@/components/weekly/weekly-import-dialog';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { Spinner } from '@/components/ui/spinner';
import { WeeklyFilterBar } from './components/weekly-filter-bar';
import { WeeklyList } from './components/weekly-list';
import { WeeklyPdfPreview } from './components/weekly-pdf-preview';
import { useWeeklyFilters } from './hooks/use-weekly-filters';
import type { WeeklyIndexProps } from './types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Weekly Data',
        href: '/Weekly',
    },
];

export default function Index({
    weeklies,
    crop_years,
    weeks_by_crop_year,
}: WeeklyIndexProps) {
    const [isClearing, setIsClearing] = useState(false);
    const [isImporting, setIsImporting] = useState(false);

    const {
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
    } = useWeeklyFilters({
        weeklies,
        weeksByCropYear: weeks_by_crop_year,
    });

    const handleClearData = () => {
        if (
            !window.confirm(
                'This will permanently delete all weekly PDFs, imported files, and weekly records. Continue?',
            )
        ) {
            return;
        }

        router.delete('/Weekly/clear', {
            preserveScroll: true,
            onStart: () => setIsClearing(true),
            onFinish: () => setIsClearing(false),
            onSuccess: clearSelection,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Weekly Data" />

            {isImporting && (
                <div className="flex w-full bg-background/80">
                    <div className="flex w-full animate-pulse items-center gap-3 rounded-lg bg-card p-4 text-sm font-medium text-muted-foreground">
                        <Spinner className="size-4" />
                        Importing weekly data...
                    </div>
                </div>
            )}
            <div className="flex flex-col">
                <Container className="w-full overflow-visible">
                    <ContainerHeader className="items-center gap-5 text-left">
                        <ContainerHeaderEnd className="min-w-0 flex-1 justify-end gap-2">
                            <WeeklyFilterBar
                                search={search}
                                onSearchChange={setSearch}
                                selectedCropYear={selectedCropYear}
                                selectedWeek={selectedWeek}
                                cropYears={crop_years}
                                weekOptions={weekOptions}
                                onCropYearChange={handleCropYearChange}
                                onWeekChange={setSelectedWeek}
                            />
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleClearData}
                                disabled={isClearing}
                            >
                                {isClearing ? 'Clearing...' : 'Clear'}
                            </Button>
                            <WeeklyImportDialog
                                setIsImporting={setIsImporting}
                                isImporting={isImporting}
                            />
                        </ContainerHeaderEnd>
                    </ContainerHeader>
                    <div className="flex gap-2">
                        <div className="mt-4 grid w-full">
                            <WeeklyList
                                groupedWeeklies={groupedWeeklies}
                                paginatedGroups={paginatedGroups}
                                selectedIds={selectedIds}
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                                onToggleSelection={toggleSelection}
                                onOpenPreview={openPreview}
                            />
                        </div>
                        <WeeklyPdfPreview
                            previewItem={previewItem}
                            previewTitle={previewTitle}
                        />
                    </div>
                </Container>
            </div>
        </AppLayout>
    );
}
