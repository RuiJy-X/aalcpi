import React from 'react';
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    Filter,
    RotateCcw,
    X,
} from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { DatePickerWithRange } from '@/components/date-range';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface BankReconControlBarProps {
    targetMonth?: string;
    selectedWeek: string;
    weekOptions: (string | number)[];
    periodRange?: DateRange;
    selectedStatus: string;
    statuses: string[];
    showDuplicates: boolean;
    hasActiveFilters: boolean;
    onMonthChange: (month: string) => void;
    onWeekChange: (week: string) => void;
    onPeriodChange: (range: DateRange | undefined) => void;
    onStatusChange: (status: string) => void;
    onToggleDuplicates: () => void;
    onClearFilters: () => void;
    formatStatusLabel: (status: string) => string;
}

export function BankReconControlBar({
    targetMonth,
    selectedWeek,
    weekOptions,
    periodRange,
    selectedStatus,
    statuses,
    showDuplicates,
    hasActiveFilters,
    onMonthChange,
    onWeekChange,
    onPeriodChange,
    onStatusChange,
    onToggleDuplicates,
    onClearFilters,
    formatStatusLabel,
}: BankReconControlBarProps) {
    const handlePrevMonth = () => {
        const base = targetMonth
            ? new Date(`${targetMonth}-01T00:00:00`)
            : new Date();
        base.setMonth(base.getMonth() - 1);
        const y = base.getFullYear();
        const m = String(base.getMonth() + 1).padStart(2, '0');
        onMonthChange(`${y}-${m}`);
    };

    const handleNextMonth = () => {
        const base = targetMonth
            ? new Date(`${targetMonth}-01T00:00:00`)
            : new Date();
        base.setMonth(base.getMonth() + 1);
        const y = base.getFullYear();
        const m = String(base.getMonth() + 1).padStart(2, '0');
        onMonthChange(`${y}-${m}`);
    };

    return (
        <div className="flex flex-col gap-3 rounded-xl border bg-card p-3.5 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Left: Quick Date & Period Controls */}
                <div className="flex flex-wrap items-center gap-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        <Filter className="h-3.5 w-3.5 text-primary" />
                        <span>Filter Period:</span>
                    </div>

                    {/* Month Picker with Prev/Next Navigation */}
                    <div className="flex items-center rounded-lg border bg-background shadow-2xs">
                        <button
                            type="button"
                            onClick={handlePrevMonth}
                            className="flex h-8 w-7 items-center justify-center rounded-l-lg border-r text-muted-foreground hover:bg-accent hover:text-foreground"
                            title="Previous month"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="font-medium text-muted-foreground">
                                Month:
                            </span>
                            <input
                                type="month"
                                value={targetMonth || ''}
                                onChange={(e) => onMonthChange(e.target.value)}
                                className="cursor-pointer bg-transparent text-xs font-semibold focus:outline-hidden"
                                title="Select month"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={handleNextMonth}
                            className="flex h-8 w-7 items-center justify-center rounded-r-lg border-l text-muted-foreground hover:bg-accent hover:text-foreground"
                            title="Next month"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Custom Range Picker */}
                    <DatePickerWithRange
                        className="w-56 sm:w-60"
                        value={periodRange}
                        onChange={onPeriodChange}
                    />

                    {/* Week Selector */}
                    <Select
                        value={selectedWeek}
                        onValueChange={onWeekChange}
                    >
                        <SelectTrigger className="h-8 w-32 bg-background text-xs font-medium">
                            <SelectValue placeholder="All Weeks" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Weeks</SelectItem>
                            {weekOptions.map((w) => (
                                <SelectItem key={String(w)} value={String(w)}>
                                    Week {w}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Right: Quick Week Pills & Reset */}
                <div className="flex flex-wrap items-center gap-2">
                    {/* Quick Week Pill Buttons (for Weeks 1-4 if available) */}
                    <div className="hidden items-center gap-1 sm:flex">
                        <button
                            type="button"
                            onClick={() => onWeekChange('all')}
                            className={`rounded-md px-2 py-1 text-xs font-semibold transition-colors ${
                                selectedWeek === 'all'
                                    ? 'bg-primary text-primary-foreground shadow-2xs'
                                    : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`}
                        >
                            All Weeks
                        </button>
                        {weekOptions.map((w) => {
                            const strW = String(w);
                            const isActive = selectedWeek === strW;
                            return (
                                <button
                                    key={strW}
                                    type="button"
                                    onClick={() => onWeekChange(strW)}
                                    className={`rounded-md px-2 py-1 text-xs font-semibold transition-colors ${
                                        isActive
                                            ? 'bg-primary text-primary-foreground shadow-2xs'
                                            : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                                    }`}
                                >
                                    Wk {w}
                                </button>
                            );
                        })}
                    </div>

                    {hasActiveFilters && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClearFilters}
                            className="h-8 gap-1.5 border border-rose-200 bg-rose-50 text-xs font-bold text-rose-700 hover:bg-rose-100 hover:text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-900/60"
                        >
                            <RotateCcw className="h-3.5 w-3.5" />
                            <span>Reset Filters</span>
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
