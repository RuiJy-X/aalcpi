import { ChevronDown, Download, FileText } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';

import type { WeeklyPlanterGroup, WeeklyRecord } from '../types';

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
    return (
        <div className="grid gap-3 border border-l-4 border-l-green-500 bg-white p-3 shadow-sm md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center">
            <div className="pt-0.5">
                <Checkbox
                    checked={isChecked}
                    onCheckedChange={(checked) =>
                        onToggleSelection(item, checked === true)
                    }
                />
            </div>

            <button
                type="button"
                onClick={() => onOpenPreview(item)}
                className="text-left"
            >
                <div className="text-sm font-medium text-foreground">
                    Week {item.week} · Crop Year {item.crop_year}
                </div>
                <div className="text-sm text-muted-foreground">
                    Segment {item.segment} · Page {item.page}
                </div>
                <div className="mt-1 truncate text-xs text-muted-foreground">
                    {item.file_location}
                </div>
            </button>

            <div className="flex flex-wrap items-center gap-2 md:justify-end">
                <Button variant="outline" size="sm" asChild>
                    <a href={item.preview_url} target="_blank" rel="noreferrer">
                        Open
                    </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                    <a href={item.download_url} download>
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
    return (
        <Collapsible
            key={`${group.planter_code}::${group.planter_name}`}
            defaultOpen={defaultOpen}
        >
            <div className="border bg-card shadow-sm">
                <CollapsibleTrigger className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition-colors hover:bg-muted/40 [&[data-state=open]>svg]:rotate-180">
                    <div className="flex min-w-0 flex-row gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                            <FileText className="size-4 text-primary" />
                            <span className="max-w-90 truncate text-sm font-semibold">
                                {group.planter_code} - {group.planter_name}
                            </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                            {group.files.length} PDF file
                            {group.files.length === 1 ? '' : 's'} · Weeks{' '}
                            {group.weeks.join(', ')}
                        </div>
                    </div>

                    <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform" />
                </CollapsibleTrigger>

                <CollapsibleContent className="border-t">
                    {group.files.map((item) => (
                        <WeeklyFileRow
                            key={item.id}
                            item={item}
                            isChecked={selectedIds.includes(item.id)}
                            onToggleSelection={onToggleSelection}
                            onOpenPreview={onOpenPreview}
                        />
                    ))}
                </CollapsibleContent>
            </div>
        </Collapsible>
    );
}
