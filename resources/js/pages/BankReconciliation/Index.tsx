import { Head, router } from '@inertiajs/react';
import type {
    ColumnFiltersState,
    PaginationState,
    SortingState,
} from '@tanstack/react-table';
import * as React from 'react';
import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';

import AppLayout from '@/layouts/app-layout';
import {
    Container,
    ContainerHeader,
    ContainerHeaderEnd,
} from '@/components/container';
import { DataTable } from '@/components/data-table/data-table';
import { DatePickerWithRange } from '@/components/date-range';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { BreadcrumbItem } from '@/types';

import { ReconciliationWorkspaceType } from './bank-recon-types';
import { bankReconWorkspaceColumns } from './bank-recon-workspace-columnDef';
import { BankReconImportDialog } from './BankReconImportDialog';
import { clear as bankReconciliationClear } from '@/routes/bank_reconciliation';
import { index as bankReconciliationIndex } from '@/routes/bank_reconciliation';
import { bankReconciliationBulkDelete } from '@/components/data-table/bulk-delete';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Filter, X } from 'lucide-react';

type DataTableQueryState = {
    sorting: SortingState;
    columnFilters: ColumnFiltersState;
    globalFilter: string;
    pagination: PaginationState;
    dateRange?: DateRange;
    dateFilterColumnId?: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Bank Reconciliation', href: bankReconciliationIndex().url },
];

const formatStatusLabel = (status: string) =>
    status
        .replace(/_/g, ' ')
        .replace(/^./, (char) => char.toUpperCase());

export default function Index({
    reconciliationWorkspaces,
    statuses = [],
    pagination,
    table_state,
    weekOptions = [],
    summaryStats = { total_count: 0, internal_total: 0, bank_total: 0 },
}: {
    reconciliationWorkspaces: ReconciliationWorkspaceType[];
    statuses: string[];
    pagination: {
        total: number;
        per_page: number;
        current_page: number;
        last_page: number;
    };
    table_state?: {
        search?: string;
        sort?: string;
        direction?: string;
        filters?: Record<string, string | string[]>;
        date_column?: string;
        date_from?: string;
        date_to?: string;
        period_from?: string;
        period_to?: string;
    };
    weekOptions?: (string | number)[];
    summaryStats?: {
        total_count: number;
        internal_total: number;
        bank_total: number;
    };
}) {
    const [isClearOpen, setClearOpen] = React.useState(false);
    const [isClearing, setIsClearing] = React.useState(false);
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
        }).format(amount);
    };

    const variance = summaryStats.internal_total - summaryStats.bank_total;

    // Period filter: matches a row if EITHER internal_date_issued OR
    // transaction_date falls inside this range. Independent of the
    // generic per-column date range used by the DataTable itself.
    const [periodRange, setPeriodRange] = React.useState<DateRange | undefined>(
        table_state?.period_from
            ? {
                  from: new Date(table_state.period_from),
                  to: table_state.period_to
                      ? new Date(table_state.period_to)
                      : undefined,
              }
            : undefined,
    );

    const handleClearAll = () => {
        setIsClearing(true);
        router.delete(bankReconciliationClear().url, {
            data: buildQueryParams(
                latestQueryRef.current,
                selectedStatus,
                selectedWeek,
                periodRange,
            ),
            preserveScroll: true,
            onSuccess: () => setClearOpen(false),
            onFinish: () => setIsClearing(false),
        });
    };
    const initialSorting = table_state?.sort
        ? [{ id: table_state.sort, desc: table_state.direction === 'desc' }]
        : [];

    const initialColumnFilters: ColumnFiltersState = table_state?.filters
        ? Object.entries(table_state.filters).map(([id, value]) => ({
              id,
              value,
          }))
        : [];

    const initialDateRange = table_state?.date_from
        ? {
              from: new Date(table_state.date_from),
              to: table_state.date_to
                  ? new Date(table_state.date_to)
                  : undefined,
          }
        : undefined;

    const initialQueryStateRef = React.useRef<DataTableQueryState>({
        sorting: initialSorting,
        columnFilters: initialColumnFilters,
        globalFilter: table_state?.search ?? '',
        pagination: {
            pageIndex: Math.max((pagination?.current_page ?? 1) - 1, 0),
            pageSize: pagination?.per_page ?? 3000,
        },
        dateRange: initialDateRange,
        dateFilterColumnId: table_state?.date_column ?? '',
    });

    const latestQueryRef = React.useRef<DataTableQueryState>(
        initialQueryStateRef.current,
    );

    const selectedStatus = React.useMemo(() => {
        const statusFilter = table_state?.filters?.status;
        if (!statusFilter) {
            return 'all';
        }
        return Array.isArray(statusFilter)
            ? (statusFilter[0] ?? 'all')
            : statusFilter;
    }, [table_state?.filters?.status]);

    const selectedWeek = React.useMemo(() => {
        const weekFilter = table_state?.filters?.disbursement_week;
        if (!weekFilter) {
            return 'all';
        }
        return Array.isArray(weekFilter)
            ? (weekFilter[0] ?? 'all')
            : weekFilter;
    }, [table_state?.filters?.disbursement_week]);

    const buildQueryParams = React.useCallback(
        (
            state: DataTableQueryState,
            status: string,
            week: string = selectedWeek,
            period: DateRange | undefined = periodRange,
        ) => {
            const query: Record<string, any> = {
                page: state.pagination.pageIndex + 1,
                per_page: state.pagination.pageSize,
            };

            if (state.globalFilter) {
                query.search = state.globalFilter;
            }

            if (state.sorting.length > 0) {
                query.sort = state.sorting[0].id;
                query.direction = state.sorting[0].desc ? 'desc' : 'asc';
            }

            const filters: Record<string, string | string[]> = {};

            state.columnFilters.forEach((filter) => {
                if (
                    filter.id === 'status' ||
                    filter.id === 'disbursement_week' ||
                    filter.id === 'bank_source'
                ) {
                    return; // these are handled separately, not via generic columnFilters
                }
                if (
                    filter.value === '' ||
                    filter.value === null ||
                    filter.value === undefined
                ) {
                    return;
                }
                if (Array.isArray(filter.value)) {
                    filters[filter.id] = filter.value.map((v) => String(v));
                    return;
                }
                filters[filter.id] = String(filter.value);
            });

            if (status !== 'all') {
                filters.status = status;
            }

            if (week !== 'all') {
                filters.disbursement_week = week;
            }

            if (Object.keys(filters).length > 0) {
                query.filters = filters;
            }

            if (state.dateRange?.from && state.dateFilterColumnId) {
                query.date_column = state.dateFilterColumnId;
                query.date_from = format(state.dateRange.from, 'yyyy-MM-dd');
                if (state.dateRange.to) {
                    query.date_to = format(state.dateRange.to, 'yyyy-MM-dd');
                }
            }

            if (period?.from) {
                query.period_from = format(period.from, 'yyyy-MM-dd');
                if (period.to) {
                    query.period_to = format(period.to, 'yyyy-MM-dd');
                }
            }

            return query;
        },
        [selectedWeek, periodRange],
    );

    const handleQueryChange = React.useCallback(
        (state: DataTableQueryState) => {
            latestQueryRef.current = state;
            const query = buildQueryParams(state, selectedStatus);
            router.get(bankReconciliationIndex().url, query, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        },
        [buildQueryParams, selectedStatus],
    );

    const applyStatusFilter = (nextStatus: string) => {
        const nextState: DataTableQueryState = {
            ...latestQueryRef.current,
            pagination: {
                ...latestQueryRef.current.pagination,
                pageIndex: 0,
            },
        };

        latestQueryRef.current = nextState;
        const query = buildQueryParams(nextState, nextStatus);

        router.get(bankReconciliationIndex().url, query, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const applyWeekFilter = (nextWeek: string) => {
        const nextState: DataTableQueryState = {
            ...latestQueryRef.current,
            pagination: {
                ...latestQueryRef.current.pagination,
                pageIndex: 0,
            },
        };

        latestQueryRef.current = nextState;
        const query = buildQueryParams(nextState, selectedStatus, nextWeek);

        router.get(bankReconciliationIndex().url, query, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const applyPeriodFilter = (nextPeriod: DateRange | undefined) => {
        setPeriodRange(nextPeriod);

        const nextState: DataTableQueryState = {
            ...latestQueryRef.current,
            pagination: {
                ...latestQueryRef.current.pagination,
                pageIndex: 0,
            },
        };

        latestQueryRef.current = nextState;
        const query = buildQueryParams(
            nextState,
            selectedStatus,
            selectedWeek,
            nextPeriod,
        );

        router.get(bankReconciliationIndex().url, query, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const hasActiveFilters =
        selectedStatus !== 'all' ||
        selectedWeek !== 'all' ||
        Boolean(periodRange?.from) ||
        Boolean(latestQueryRef.current.globalFilter) ||
        Boolean(latestQueryRef.current.dateRange?.from) ||
        latestQueryRef.current.columnFilters.some(
            (filter) =>
                filter.id !== 'status' && filter.id !== 'disbursement_week',
        ) ||
        latestQueryRef.current.sorting.length > 0;

    const clearAllFilters = () => {
        setPeriodRange(undefined);
        router.get(bankReconciliationIndex().url, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Bank Reconciliation" />
            <div className="mx-2 mb-6 flex items-center gap-3">
                <Filter className="flex items-center text-gray-500" />
                <Select
                    value={selectedWeek}
                    onValueChange={(nextWeek) => applyWeekFilter(nextWeek)}
                >
                    <SelectTrigger className="w-32 bg-white">
                        <SelectValue placeholder="Week" />
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
                {/*
                    Period filter: matches internal_date_issued OR
                    transaction_date. bank_date is no longer used for
                    filtering — it's just an upload-batch label now.
                */}
                <DatePickerWithRange
                    className="w-64 bg-white"
                    value={periodRange}
                    onChange={(nextRange) => applyPeriodFilter(nextRange)}
                />
                <Select
                    value={selectedStatus}
                    onValueChange={(nextStatus) =>
                        applyStatusFilter(nextStatus)
                    }
                >
                    <SelectTrigger className="w-44 bg-white">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        {statuses.map((status) => (
                            <SelectItem key={status} value={status}>
                                {formatStatusLabel(status)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {hasActiveFilters && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearAllFilters}
                        className="gap-1.5 border border-slate-200 bg-red-200 text-foreground hover:bg-red-300 hover:text-foreground"
                    >
                        <X className="h-3.5 w-3.5" />
                        Clear filters
                    </Button>
                )}
            </div>
            <div className="mx-2 mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="rounded-xl border bg-card p-4 shadow-sm">
                    <p className="text-sm font-medium text-muted-foreground">
                        Filtered Records
                    </p>
                    <p className="mt-1 truncate text-2xl font-bold">
                        {summaryStats.total_count}
                    </p>
                </div>

                <div className="rounded-xl border bg-card p-4 shadow-sm">
                    <p className="text-sm font-medium text-muted-foreground">
                        Internal Total
                    </p>
                    <p className="mt-1 truncate text-2xl font-bold text-blue-600">
                        {formatCurrency(summaryStats.internal_total)}
                    </p>
                </div>

                <div className="rounded-xl border bg-card p-4 shadow-sm">
                    <p className="text-sm font-medium text-muted-foreground">
                        Bank Total
                    </p>
                    <p className="mt-1 truncate text-2xl font-bold text-amber-600">
                        {formatCurrency(summaryStats.bank_total)}
                    </p>
                </div>

                <div
                    className={`rounded-xl border p-4 shadow-sm ${variance === 0 ? 'border-emerald-200 bg-emerald-50/50' : 'border-destructive/20 bg-destructive/5'}`}
                >
                    <p className="text-sm font-medium text-muted-foreground">
                        Net Variance
                    </p>
                    <p
                        className={`text-md mt-1 truncate font-bold md:text-2xl ${variance === 0 ? 'text-emerald-600' : 'text-destructive'}`}
                    >
                        {formatCurrency(variance)}
                    </p>
                </div>
            </div>
            <Container>
                <ContainerHeader>
                    Bank Reconciliation
                    <ContainerHeaderEnd>
                        <Button
                            variant="destructive"
                            onClick={() => setClearOpen(true)}
                        >
                            Delete All
                        </Button>

                        <BankReconImportDialog />
                    </ContainerHeaderEnd>
                    <Dialog open={isClearOpen} onOpenChange={setClearOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>
                                    Delete all matching records?
                                </DialogTitle>
                                <DialogDescription>
                                    This permanently deletes every
                                    reconciliation record matching your current
                                    filters
                                    {selectedStatus !== 'all'
                                        ? ` (status: ${formatStatusLabel(selectedStatus)})`
                                        : ''}
                                    {selectedWeek !== 'all'
                                        ? ` (week: ${selectedWeek})`
                                        : ''}
                                    {periodRange?.from
                                        ? ` (period: ${format(periodRange.from, 'MMM d, yyyy')}${periodRange.to ? ` – ${format(periodRange.to, 'MMM d, yyyy')}` : ''})`
                                        : ''}
                                    . This cannot be undone.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button
                                        variant="secondary"
                                        disabled={isClearing}
                                    >
                                        Cancel
                                    </Button>
                                </DialogClose>
                                <Button
                                    variant="destructive"
                                    onClick={handleClearAll}
                                    disabled={isClearing}
                                >
                                    {isClearing ? 'Deleting…' : 'Delete All'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </ContainerHeader>
                <DataTable
                    columns={bankReconWorkspaceColumns}
                    data={reconciliationWorkspaces}
                    serverSide
                    pageCount={pagination.last_page}
                    totalRows={pagination.total}
                    initialState={initialQueryStateRef.current}
                    bulkDelete={bankReconciliationBulkDelete}
                    onQueryChange={handleQueryChange}
                />
            </Container>
        </AppLayout>
    );
}