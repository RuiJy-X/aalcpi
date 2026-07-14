import { useMemo } from 'react';
import { ChevronDown, Download, FileText } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';

import type { WeeklyPlanterGroup, WeeklyRecord } from '../types';
import { sortNumericStrings } from '../utils';

function WeeklyFileRow({
    item,
    isChecked,
    onToggleSelection,
    onOpenPreview,
}: {
    item: WeeklyRecord;
    isChecked: boolean;
    onToggleSelection: (item: WeeklyRecord, checked: boolean) => void;
    onOpenPreview: (item: WeeklyRecord) => void;
}) {
    const activate = () => {
        // Always activate this row alone (single selection).
        onToggleSelection(item, true);
        onOpenPreview(item);
    };

    return (
        <div
            className={`grid cursor-pointer gap-3 border border-l-4 p-3 shadow-sm transition-colors md:grid-cols-[minmax(0,1fr)_auto] md:items-center ${
                isChecked
                    ? 'border-green-300 border-l-green-600 bg-green-50/80'
                    : 'border-l-green-500 bg-white hover:bg-green-50/50'
            }`}
            onClick={activate}
            onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    activate();
                }
            }}
            role="button"
            tabIndex={0}
            aria-pressed={isChecked}
        >
            <div className="min-w-0 text-left">
                <div className="text-sm font-medium text-foreground">
                    Week {item.week} · Crop Year {item.crop_year}
                </div>
                <div className="text-sm text-muted-foreground">
                    Segment {item.segment} · Page {item.page}
                </div>
                <div className="mt-1 truncate text-xs text-muted-foreground">
                    {item.file_location}
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 md:justify-end">
                <Button variant="outline" size="sm" asChild>
                    <a
                        href={item.preview_url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(event) => event.stopPropagation()}
                    >
                        Open
                    </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                    <a
                        href={item.download_url}
                        download
                        onClick={(event) => event.stopPropagation()}
                    >
                        <Download />
                        Download
                    </a>
                </Button>
            </div>
        </div>
    );
}

export function WeeklyPlanterGroupCard({
    group,
    defaultOpen,
    selectedIds,
    onToggleSelection,
    onOpenPreview,
}: {
    group: WeeklyPlanterGroup;
    defaultOpen: boolean;
    selectedIds: number[];
    onToggleSelection: (item: WeeklyRecord, checked: boolean) => void;
    onOpenPreview: (item: WeeklyRecord) => void;
}) {
    const filesByWeek = useMemo(() => {
        const map = new Map<string, WeeklyRecord[]>();

        group.files.forEach((file) => {
            const weekKey = String(file.week);
            const existing = map.get(weekKey);
            if (existing) {
                existing.push(file);
                return;
            }
            map.set(weekKey, [file]);
        });

        const orderedWeeks = sortNumericStrings(Array.from(map.keys()));

        return orderedWeeks.map((week) => ({
            week,
            files: map.get(week) ?? [],
        }));
    }, [group.files]);

    const fileCount = group.file_count ?? group.files.length;
    const weeksLabel =
        group.weeks.length > 0 ? group.weeks.join(', ') : 'none';

    return (
        <Collapsible
            key={`${group.planter_code}::${group.planter_name}`}
            defaultOpen={defaultOpen}
            className="min-h-0"
        >
            <div className="border bg-card shadow-sm">
                <CollapsibleTrigger className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition-colors hover:bg-muted/40 [&[data-state=open]>svg]:rotate-180">
                    <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                        <div className="flex min-w-0 items-center gap-2">
                            <FileText className="size-4 shrink-0 text-primary" />
                            <span className="truncate text-sm font-semibold">
                                {group.planter_code} - {group.planter_name}
                            </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                            {fileCount} PDF file{fileCount === 1 ? '' : 's'} ·
                            Weeks {weeksLabel}
                        </div>
                    </div>

                    <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform" />
                </CollapsibleTrigger>

                <CollapsibleContent className="border-t">
                    {/* Scrollable full file list — no per-file pagination */}
                    <div className="max-h-[min(28rem,55vh)] space-y-3 overflow-y-auto p-3">
                        {filesByWeek.map(({ week, files }) => (
                            <div key={week} className="space-y-2">
                                <div className="sticky top-0 z-10 bg-card/95 px-1 py-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase backdrop-blur-sm">
                                    Week {week}
                                    <span className="ml-2 font-normal normal-case">
                                        ({files.length} file
                                        {files.length === 1 ? '' : 's'})
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    {files.map((item) => (
                                        <WeeklyFileRow
                                            key={item.id}
                                            item={item}
                                            isChecked={selectedIds.includes(
                                                item.id,
                                            )}
                                            onToggleSelection={
                                                onToggleSelection
                                            }
                                            onOpenPreview={onOpenPreview}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}

                        {group.files.length === 0 && (
                            <p className="px-1 py-4 text-center text-sm text-muted-foreground">
                                No PDF files for this planter with the current
                                filters.
                            </p>
                        )}
                    </div>
                </CollapsibleContent>
            </div>
        </Collapsible>
    );
}
