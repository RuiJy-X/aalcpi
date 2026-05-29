import { Button } from '@/components/ui/button';

import type { WeeklyPlanterGroup, WeeklyRecord } from '../types';
import { WeeklyPlanterGroupCard } from './weekly-planter-group-card';

export function WeeklyList({
    groupedWeeklies,
    paginatedGroups,
    selectedIds,
    currentPage,
    totalPages,
    pagination,
    onPageChange,
    onToggleSelection,
    onOpenPreview,
}: {
    groupedWeeklies: WeeklyPlanterGroup[];
    paginatedGroups: WeeklyPlanterGroup[];
    selectedIds: number[];
    currentPage: number;
    totalPages: number;
    pagination: {
        total: number;
        per_page: number;
        current_page: number;
        last_page: number;
    };
    onPageChange: (page: number) => void;
    onToggleSelection: (item: WeeklyRecord, checked: boolean) => void;
    onOpenPreview: (item: WeeklyRecord) => void;
}) {
    if (groupedWeeklies.length === 0) {
        return (
            <div className="rounded-xl border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">
                No weekly PDFs match the current filters.
            </div>
        );
    }

    return (
        <>
            {paginatedGroups.map((group, index) => (
                <WeeklyPlanterGroupCard
                    key={`${group.planter_code}::${group.planter_name}`}
                    group={group}
                    defaultOpen={index === 0}
                    selectedIds={selectedIds}
                    onToggleSelection={onToggleSelection}
                    onOpenPreview={onOpenPreview}
                />
            ))}

            {totalPages > 1 && (
                <div className="flex items-center justify-between border-t pt-4">
                    <p className="text-sm text-muted-foreground">
                        Showing{' '}
                        {pagination.total === 0
                            ? 0
                            : (currentPage - 1) * pagination.per_page + 1}{' '}
                        to{' '}
                        {Math.min(
                            currentPage * pagination.per_page,
                            pagination.total,
                        )}{' '}
                        of {pagination.total} files
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                onPageChange(Math.max(1, currentPage - 1))
                            }
                            disabled={currentPage === 1}
                        >
                            Previous
                        </Button>
                        <div className="flex items-center px-2 text-sm font-medium">
                            Page {currentPage} of {totalPages}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                onPageChange(
                                    Math.min(totalPages, currentPage + 1),
                                )
                            }
                            disabled={currentPage === totalPages}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </>
    );
}
