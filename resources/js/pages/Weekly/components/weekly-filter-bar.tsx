import { Search } from 'lucide-react';

import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export function WeeklyFilterBar({
    search,
    onSearchChange,
    selectedCropYear,
    selectedWeek,
    cropYears,
    weekOptions,
    onCropYearChange,
    onWeekChange,
}: {
    search: string;
    onSearchChange: (value: string) => void;
    selectedCropYear: string;
    selectedWeek: string;
    cropYears: string[];
    weekOptions: string[];
    onCropYearChange: (value: string) => void;
    onWeekChange: (value: string) => void;
}) {
    return (
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl bg-card">
            <div className="relative max-w-80 min-w-[12rem] flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    value={search}
                    onChange={(event) => onSearchChange(event.target.value)}
                    placeholder="Search planter"
                    className="h-10 pl-9 text-sm"
                />
            </div>

            <Select value={selectedCropYear} onValueChange={onCropYearChange}>
                <SelectTrigger className="h-10 w-[9rem] shrink-0 text-sm">
                    <SelectValue placeholder="C.Year" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all" className="w-fit">
                        All Years
                    </SelectItem>
                    {cropYears.map((cropYear) => (
                        <SelectItem
                            key={cropYear}
                            value={cropYear}
                            className="w-fit"
                        >
                            {cropYear}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select value={selectedWeek} onValueChange={onWeekChange}>
                <SelectTrigger className="h-10 w-[7rem] shrink-0 text-sm">
                    <SelectValue placeholder="Wk" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Wks</SelectItem>
                    {weekOptions.map((week) => (
                        <SelectItem key={week} value={week}>
                            Wk {week}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
