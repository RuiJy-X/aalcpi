import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { Filter, X } from 'lucide-react';
import { DatePickerWithRange } from '@/components/date-range';
import { Button } from '@/components/ui/button';

type PeriodFilterBarProps = {
    value?: DateRange;
    onChange: (range: DateRange | undefined) => void;
    className?: string;
};

export function formatPeriodLabel(range?: DateRange): string | undefined {
    if (!range?.from) {
        return undefined;
    }

    const from = format(range.from, 'MMM d, yyyy');
    if (!range.to) {
        return from;
    }

    return `${from} to ${format(range.to, 'MMM d, yyyy')}`;
}

/**
 * Global server-side date range filter bar (Bank Reconciliation style).
 */
export function PeriodFilterBar({
    value,
    onChange,
    className = '',
}: PeriodFilterBarProps) {
    const hasPeriod = Boolean(value?.from);

    return (
        <div className={`mx-2 mb-4 flex flex-wrap items-center gap-3 ${className}`}>
            <Filter className="size-4 text-gray-500" />
            <DatePickerWithRange
                className="w-64 bg-white"
                value={value}
                onChange={onChange}
            />
            {hasPeriod && (
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onChange(undefined)}
                    className="gap-1.5 border border-slate-200 bg-red-200 text-foreground hover:bg-red-300 hover:text-foreground"
                >
                    <X className="h-3.5 w-3.5" />
                    Clear period
                </Button>
            )}
        </div>
    );
}
