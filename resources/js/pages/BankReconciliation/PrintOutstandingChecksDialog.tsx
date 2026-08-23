import * as React from 'react';
import { Printer, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import type { DateRange } from 'react-day-picker';
import { DatePickerWithRange } from '@/components/date-range';
import { Label } from '@/components/ui/label';

type OutstandingCheckItem = {
    no: number;
    date: string;
    raw_date: string;
    payee_name: string;
    check_no: string;
    amount: number;
    date_cleared: string;
};

type MonthGroup = {
    month_key: string;
    month_label: string;
    items: OutstandingCheckItem[];
    subtotal: number;
};

type OutstandingChecksResponse = {
    date_from: string;
    date_to: string;
    months: MonthGroup[];
    grand_total: number;
    total_count: number;
};

export function PrintOutstandingChecksDialog({
    defaultPeriodFrom = '',
    defaultPeriodTo = '',
}: {
    defaultPeriodFrom?: string;
    defaultPeriodTo?: string;
}) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [dateRange, setDateRange] = React.useState<DateRange | undefined>(
        defaultPeriodFrom
            ? {
                  from: new Date(defaultPeriodFrom),
                  to: defaultPeriodTo ? new Date(defaultPeriodTo) : undefined,
              }
            : undefined,
    );
    const [isLoading, setIsLoading] = React.useState(false);
    const [previewData, setPreviewData] = React.useState<OutstandingChecksResponse | null>(null);
    const [fetchError, setFetchError] = React.useState<string | null>(null);

    const fetchPreview = React.useCallback(async (fromVal: string, toVal: string) => {
        setIsLoading(true);
        setFetchError(null);
        try {
            const params = new URLSearchParams();
            if (fromVal) params.append('date_from', fromVal);
            if (toVal) params.append('date_to', toVal);

            const res = await fetch(`/BankReconciliation/outstanding-checks?${params.toString()}`, {
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data: OutstandingChecksResponse = await res.json();
            setPreviewData(data);
        } catch (err) {
            const e = err as Error;
            setFetchError(e.message || 'Failed to fetch outstanding checks');
        } finally {
            setIsLoading(false);
        }
    }, []);

    React.useEffect(() => {
        if (isOpen) {
            const initialRange: DateRange | undefined = defaultPeriodFrom
                ? {
                      from: new Date(defaultPeriodFrom),
                      to: defaultPeriodTo
                          ? new Date(defaultPeriodTo)
                          : undefined,
                  }
                : undefined;
            setDateRange(initialRange);
            fetchPreview(defaultPeriodFrom, defaultPeriodTo);
        }
    }, [isOpen, defaultPeriodFrom, defaultPeriodTo, fetchPreview]);

    const handleRangeChange = (nextRange: DateRange | undefined) => {
        setDateRange(nextRange);
        const fromStr = nextRange?.from
            ? format(nextRange.from, 'yyyy-MM-dd')
            : '';
        const toStr = nextRange?.to
            ? format(nextRange.to, 'yyyy-MM-dd')
            : nextRange?.from
              ? format(nextRange.from, 'yyyy-MM-dd')
              : '';
        fetchPreview(fromStr, toStr);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
        }).format(amount);
    };

    const triggerPrint = (useDomPdf = false) => {
        const params = new URLSearchParams();
        const fromStr = dateRange?.from
            ? format(dateRange.from, 'yyyy-MM-dd')
            : '';
        const toStr = dateRange?.to
            ? format(dateRange.to, 'yyyy-MM-dd')
            : fromStr;

        if (fromStr) params.append('date_from', fromStr);
        if (toStr) params.append('date_to', toStr);

        const route = useDomPdf ? '/BankReconciliation/outstanding-checks-pdf' : '/BankReconciliation/outstanding-checks-print';
        window.open(`${route}?${params.toString()}`, '_blank');
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Printer className="h-4 w-4" />
                    Print Outstanding
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Printer className="h-5 w-5 text-primary" />
                        Print Outstanding Checks
                    </DialogTitle>
                    <DialogDescription>
                        Select a date range to get all outstanding checks
                        separated by month.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="space-y-1.5">
                        <Label>Date Range</Label>
                        <DatePickerWithRange
                            value={dateRange}
                            onChange={handleRangeChange}
                            className="w-full"
                        />
                    </div>

                    {dateRange?.from && (
                        <div className="flex justify-end">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setDateRange(undefined);
                                    fetchPreview('', '');
                                }}
                                className="h-7 text-xs text-muted-foreground"
                            >
                                Clear date filter (All Dates)
                            </Button>
                        </div>
                    )}

                    <div className="rounded-lg border bg-slate-50 p-4 dark:bg-slate-900">
                        {isLoading ? (
                            <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground">
                                <Loader2 className="h-5 w-5 animate-spin" />
                                <span>Fetching outstanding checks...</span>
                            </div>
                        ) : fetchError ? (
                            <div className="py-4 text-center text-sm text-destructive">
                                {fetchError}
                            </div>
                        ) : previewData ? (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-muted-foreground">
                                        Total Outstanding Checks:
                                    </span>
                                    <span className="text-base font-bold text-foreground">
                                        {previewData.total_count} record
                                        {previewData.total_count === 1
                                            ? ''
                                            : 's'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-muted-foreground">
                                        Total Outstanding Amount:
                                    </span>
                                    <span className="text-base font-bold text-sky-600">
                                        {formatCurrency(
                                            previewData.grand_total,
                                        )}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-muted-foreground">
                                        Months Included:
                                    </span>
                                    <span className="text-sm font-semibold">
                                        {previewData.months.length} month
                                        {previewData.months.length === 1
                                            ? ''
                                            : 's'}
                                    </span>
                                </div>

                                {previewData.months.length > 0 && (
                                    <div className="mt-3 max-h-36 space-y-1 overflow-y-auto border-t pt-2 text-xs text-muted-foreground">
                                        {previewData.months.map((m) => (
                                            <div
                                                key={m.month_key}
                                                className="flex justify-between py-0.5"
                                            >
                                                <span>
                                                    {m.month_label} (
                                                    {m.items.length} checks)
                                                </span>
                                                <span className="font-mono">
                                                    {formatCurrency(m.subtotal)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : null}
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-2">
                    <DialogClose asChild>
                        <Button variant="secondary">Cancel</Button>
                    </DialogClose>
                    <Button
                        variant="outline"
                        onClick={() => triggerPrint(true)}
                        disabled={
                            isLoading ||
                            !previewData ||
                            previewData.total_count === 0
                        }
                        title="Generate server PDF (for small datasets)"
                    >
                        Server PDF
                    </Button>
                    <Button
                        onClick={() => triggerPrint(false)}
                        disabled={
                            isLoading ||
                            !previewData ||
                            previewData.total_count === 0
                        }
                        className="gap-2"
                        title="Fast print/PDF via browser (recommended for large datasets)"
                    >
                        <Printer className="h-4 w-4" />
                        Print Report
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
