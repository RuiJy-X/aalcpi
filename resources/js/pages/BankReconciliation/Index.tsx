import { Head, Link, router } from '@inertiajs/react';
import type {
    ColumnFiltersState,
    PaginationState,
    SortingState,
} from '@tanstack/react-table';
import * as React from 'react';
import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { Calendar, History } from 'lucide-react';

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
import { PrintOutstandingChecksDialog } from './PrintOutstandingChecksDialog';
import { ImportHistoryDialog } from '@/components/import/import-history-dialog';
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
import { FolderSearch, X, FileSpreadsheet } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTableSearch } from '@/components/data-table/data-table-search';
import { DateFilterStatusBanner } from './components/DateFilterStatusBanner';
import { ImportedFilesModal } from './components/ImportedFilesModal';
import type { FileAuditStatsType } from './bank-recon-types';

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
    status.replace(/_/g, ' ').replace(/^./, (char) => char.toUpperCase());

export default function Index({
    reconciliationWorkspaces,
    statuses = [],
    pagination,
    table_state,
    weekOptions = [],
    summaryStats = { total_count: 0, internal_total: 0, bank_total: 0 },
    kpiStats = {
        matched: 0,
        outstanding: 0,
        mismatched: 0,
        unrecorded: 0,
        duplicates: 0,
    },
    fileAuditStats,
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
    // Driven ONLY by the period date range on the backend (see
    // buildKpiStats in the controller) — never affected by status, week,
    // duplicate toggle, or search, so these numbers stay a fixed read of
    // "what's in this date range" while the user drills around below.
    kpiStats?: {
        matched: number;
        outstanding: number;
        mismatched: number;
        unrecorded: number;
        duplicates: number;
    };
    fileAuditStats?: FileAuditStatsType;
}) {
    const [isClearOpen, setClearOpen] = React.useState(false);
    const [isClearing, setIsClearing] = React.useState(false);
    const [isFilesModalOpen, setIsFilesModalOpen] = React.useState(false);
    const [importModalConfig, setImportModalConfig] = React.useState<{
        open: boolean;
        type?: 'internal' | 'bank';
        week?: number;
        bankMonth?: string;
        dateIssued?: string;
    }>({ open: false });

    const handleImportMissing = (type: 'internal' | 'bank', week?: number) => {
        setImportModalConfig({
            open: true,
            type,
            week,
            bankMonth: fileAuditStats?.target_month,
            dateIssued: fileAuditStats?.period_from,
        });
    };

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

    const activeTab = React.useMemo(() => {
        const dupFilter = table_state?.filters?.is_duplicate;
        const dupVal = Array.isArray(dupFilter) ? dupFilter[0] : dupFilter;
        if (dupVal === '1' || dupVal === 'true') {
            return 'duplicates';
        }

        const statusFilter = table_state?.filters?.status;
        if (!statusFilter) {
            return 'all';
        }
        return Array.isArray(statusFilter)
            ? (statusFilter[0] ?? 'all')
            : statusFilter;
    }, [table_state?.filters?.is_duplicate, table_state?.filters?.status]);

    const allCount = React.useMemo(() => {
        return (
            (kpiStats?.matched ?? 0) +
            (kpiStats?.outstanding ?? 0) +
            (kpiStats?.unrecorded ?? 0) +
            (kpiStats?.mismatched ?? 0)
        );
    }, [kpiStats]);

    const selectedWeek = React.useMemo(() => {
        const weekFilter = table_state?.filters?.disbursement_week;
        if (!weekFilter) {
            return 'all';
        }
        return Array.isArray(weekFilter)
            ? (weekFilter[0] ?? 'all')
            : weekFilter;
    }, [table_state?.filters?.disbursement_week]);

    const [searchValue, setSearchValue] = React.useState(
        table_state?.search ?? '',
    );

    const buildQueryParams = React.useCallback(
        (
            state: DataTableQueryState,
            tab: string = activeTab,
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
                    filter.id === 'is_duplicate' ||
                    filter.id === 'bank_source'
                ) {
                    return;
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

            if (tab === 'duplicates') {
                filters.is_duplicate = '1';
            } else if (tab !== 'all') {
                filters.status = tab;
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
        [activeTab, selectedWeek, periodRange],
    );

    const handleClearAll = () => {
        setIsClearing(true);
        router.delete(bankReconciliationClear().url, {
            data: buildQueryParams(
                latestQueryRef.current,
                activeTab,
                selectedWeek,
                periodRange,
            ),
            preserveScroll: true,
            onSuccess: () => setClearOpen(false),
            onFinish: () => setIsClearing(false),
        });
    };

    const handleQueryChange = React.useCallback(
        (state: DataTableQueryState) => {
            latestQueryRef.current = state;
            const query = buildQueryParams(state, activeTab);
            router.get(bankReconciliationIndex().url, query, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        },
        [buildQueryParams, activeTab],
    );

    const handleSearchChange = React.useCallback(
        (nextSearch: string) => {
            if (nextSearch === (table_state?.search ?? '')) {
                return;
            }
            setSearchValue(nextSearch);
            const nextState: DataTableQueryState = {
                ...latestQueryRef.current,
                globalFilter: nextSearch,
                pagination: {
                    ...latestQueryRef.current.pagination,
                    pageIndex: 0,
                },
            };
            latestQueryRef.current = nextState;
            const query = buildQueryParams(nextState, activeTab);
            router.get(bankReconciliationIndex().url, query, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        },
        [buildQueryParams, activeTab, table_state?.search],
    );

    const applyTabFilter = (nextTab: string) => {
        const nextState: DataTableQueryState = {
            ...latestQueryRef.current,
            pagination: {
                ...latestQueryRef.current.pagination,
                pageIndex: 0,
            },
        };

        latestQueryRef.current = nextState;
        const query = buildQueryParams(nextState, nextTab);

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
        const query = buildQueryParams(nextState, activeTab, nextWeek);

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
            activeTab,
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
        activeTab !== 'all' ||
        selectedWeek !== 'all' ||
        Boolean(periodRange?.from) ||
        Boolean(latestQueryRef.current.globalFilter) ||
        Boolean(latestQueryRef.current.dateRange?.from) ||
        latestQueryRef.current.columnFilters.some(
            (filter) =>
                filter.id !== 'status' &&
                filter.id !== 'disbursement_week' &&
                filter.id !== 'is_duplicate',
        ) ||
        latestQueryRef.current.sorting.length > 0;

    const clearAllFilters = () => {
        setPeriodRange(undefined);
        setSearchValue('');
        router.get(bankReconciliationIndex().url, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const handleExportExcel = () => {
        const params = new URLSearchParams();
        if (activeTab) {
            params.append('tab', activeTab);
        }
        if (table_state?.period_from) {
            params.append('period_from', table_state.period_from);
        }
        if (table_state?.period_to) {
            params.append('period_to', table_state.period_to);
        }
        if (selectedWeek !== 'all') {
            params.append('disbursement_week', selectedWeek);
        }
        if (searchValue) {
            params.append('search', searchValue);
        }
        if (table_state?.date_column && table_state?.date_from) {
            params.append('date_column', table_state.date_column);
            params.append('date_from', table_state.date_from);
            if (table_state?.date_to) {
                params.append('date_to', table_state.date_to);
            }
        }

        window.open(`/BankReconciliation/export?${params.toString()}`, '_blank');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Bank Reconciliation" />
            <div className="mb-8">
                <div className="flex justify-between">
                    <h1 className="flex flex-wrap items-center gap-2.5 text-3xl font-bold tracking-tight text-foreground">
                        Bank Reconciliation
                    </h1>
                    <DateFilterStatusBanner
                        fileAuditStats={fileAuditStats}
                        selectedWeek={selectedWeek}
                        activeTab={activeTab}
                        onOpenFilesModal={() => setIsFilesModalOpen(true)}
                    />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                    Track all spreadsheet uploads, monitor background
                    processing, and safely revert specific import batches.
                </p>
            </div>
            <div className="my-2 flex justify-end">
                {/* Date / Month / Week / Duplicates Filter Controls */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
                    {/* Month Quick Select */}
                    <div className="flex items-center gap-1.5 rounded-sm border border-input bg-white px-2.5 py-2 shadow-xs">
                        <span className="font-medium text-muted-foreground">
                            Month:
                        </span>
                        <input
                            type="month"
                            value={fileAuditStats?.target_month || ''}
                            onChange={(e) => {
                                if (!e.target.value) {
                                    applyPeriodFilter(undefined);
                                    return;
                                }
                                const [y, m] = e.target.value
                                    .split('-')
                                    .map(Number);
                                const from = new Date(y, m - 1, 1);
                                const to = new Date(y, m, 0);
                                applyPeriodFilter({ from, to });
                            }}
                            className="cursor-pointer bg-transparent text-xs font-medium focus:outline-hidden"
                            title="Filter by month"
                        />
                    </div>

                    <Select
                        value={selectedWeek}
                        onValueChange={(nextWeek) => applyWeekFilter(nextWeek)}
                    >
                        <SelectTrigger className="w-28 bg-white">
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

                    <DatePickerWithRange
                        className="w-60 bg-white"
                        value={periodRange}
                        onChange={(nextRange) => applyPeriodFilter(nextRange)}
                    />

                    {hasActiveFilters && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearAllFilters}
                            className="gap-1.5 border border-slate-200 bg-red-200 text-foreground hover:bg-red-300 hover:text-foreground"
                        >
                            <X className="h-3.5 w-3.5" />
                            Clear
                        </Button>
                    )}
                </div>
            </div>
            {/* Filter & Status Navigation Bar */}
            <div className="mx-2 mb-4 space-y-3">
                <div className="flex flex-col gap-3 border-b border-border/60 pb-3 sm:flex-row sm:items-center sm:justify-between">
                    {/* Status Tabs Navigation */}
                    <Tabs
                        value={activeTab}
                        onValueChange={(val) => applyTabFilter(val)}
                        className="w-full sm:w-auto"
                    >
                        <TabsList variant="line" className="h-10">
                            <TabsTrigger
                                value="all"
                                className="gap-2 text-xs font-semibold sm:text-sm"
                            >
                                All
                                <Badge
                                    variant="secondary"
                                    className="px-1.5 py-0.5 text-xs font-bold"
                                >
                                    {allCount.toLocaleString()}
                                </Badge>
                            </TabsTrigger>
                            <TabsTrigger
                                value="Outstanding"
                                className="gap-2 text-xs font-semibold sm:text-sm"
                            >
                                Outstanding
                                <Badge
                                    variant="outline"
                                    className="border-sky-300 bg-sky-50 px-1.5 py-0.5 text-xs font-bold text-sky-800 dark:border-sky-800 dark:bg-sky-950/60 dark:text-sky-300"
                                >
                                    {(
                                        kpiStats?.outstanding ?? 0
                                    ).toLocaleString()}
                                </Badge>
                            </TabsTrigger>
                            <TabsTrigger
                                value="Unrecorded Bank Entry"
                                className="gap-2 text-xs font-semibold sm:text-sm"
                            >
                                Unrecorded
                                <Badge
                                    variant="outline"
                                    className="border-purple-300 bg-purple-50 px-1.5 py-0.5 text-xs font-bold text-purple-800 dark:border-purple-800 dark:bg-purple-950/60 dark:text-purple-300"
                                >
                                    {(
                                        kpiStats?.unrecorded ?? 0
                                    ).toLocaleString()}
                                </Badge>
                            </TabsTrigger>
                            <TabsTrigger
                                value="Matched"
                                className="gap-2 text-xs font-semibold sm:text-sm"
                            >
                                Matched
                                <Badge
                                    variant="outline"
                                    className="border-emerald-300 bg-emerald-50 px-1.5 py-0.5 text-xs font-bold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                                >
                                    {(kpiStats?.matched ?? 0).toLocaleString()}
                                </Badge>
                            </TabsTrigger>
                            <TabsTrigger
                                value="Amount Mismatch"
                                className="gap-2 text-xs font-semibold sm:text-sm"
                            >
                                Mismatch
                                <Badge
                                    variant="outline"
                                    className="border-rose-300 bg-rose-50 px-1.5 py-0.5 text-xs font-bold text-rose-800 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                                >
                                    {(
                                        kpiStats?.mismatched ?? 0
                                    ).toLocaleString()}
                                </Badge>
                            </TabsTrigger>
                            <TabsTrigger
                                value="duplicates"
                                className="gap-2 text-xs font-semibold sm:text-sm"
                            >
                                Duplicates
                                <Badge
                                    variant="outline"
                                    className="border-amber-300 bg-amber-50 px-1.5 py-0.5 text-xs font-bold text-amber-800 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                                >
                                    {(
                                        kpiStats?.duplicates ?? 0
                                    ).toLocaleString()}
                                </Badge>
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </div>

            {/* Imported & Missing Files Modal */}
            <ImportedFilesModal
                open={isFilesModalOpen}
                onOpenChange={setIsFilesModalOpen}
                fileAuditStats={fileAuditStats}
                onImportMissing={handleImportMissing}
            />

            {/* Controlled Import Dialog for direct missing item actions */}
            <BankReconImportDialog
                open={importModalConfig.open}
                onOpenChange={(open) =>
                    setImportModalConfig((prev) => ({ ...prev, open }))
                }
                initialType={importModalConfig.type}
                initialWeek={importModalConfig.week}
                initialBankMonth={importModalConfig.bankMonth}
                initialDateIssued={importModalConfig.dateIssued}
                trigger={null}
            />

            <Container>
                <ContainerHeader className="border-b-0 pb-0">
                    <ContainerHeaderEnd className="w-full flex-wrap justify-between gap-4">
                        <DataTableSearch
                            value={searchValue}
                            onChange={handleSearchChange}
                            placeholder="Search all columns..."
                            className="w-full sm:w-72"
                        />
                        <div className="flex flex-wrap items-center gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setIsFilesModalOpen(true)}
                                className="gap-2"
                            >
                                <FolderSearch className="h-4 w-4 text-primary" />
                                File Status (
                                {fileAuditStats?.total_imported_files ?? 0}/
                                {fileAuditStats?.total_expected_files ?? 5})
                            </Button>

                            <PrintOutstandingChecksDialog
                                defaultPeriodFrom={table_state?.period_from}
                                defaultPeriodTo={table_state?.period_to}
                            />
                            <Button
                                variant="outline"
                                onClick={handleExportExcel}
                                className="gap-2 text-emerald-700 hover:text-emerald-800 dark:text-emerald-400"
                                title="Export all 6 status sheets to Excel"
                            >
                                <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                Export Excel
                            </Button>
                            <BankReconImportDialog />
                            <Button
                                variant="destructive"
                                onClick={() => setClearOpen(true)}
                            >
                                Delete All
                            </Button>
                        </div>
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
                                    {activeTab === 'duplicates'
                                        ? ' (duplicates only)'
                                        : activeTab !== 'all'
                                          ? ` (status: ${formatStatusLabel(activeTab)})`
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
