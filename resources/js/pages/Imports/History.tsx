import React, { useMemo, useState, useCallback, useRef } from 'react';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import {
    History,
    CheckCircle2,
    XCircle,
    Clock,
    Filter,
    ArrowLeft,
    RefreshCw,
    FileText,
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import {
    Container,
    ContainerHeader,
    ContainerHeaderEnd,
} from '@/components/container';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import {
    DataTable,
    type DataTableQueryState,
} from '@/components/data-table/data-table';
import { DataTableSearch } from '@/components/data-table/data-table-search';
import type { BreadcrumbItem } from '@/types';
import {
    ImportSummaryModal,
    type ImportSummaryData,
} from '@/components/import/import-summary-modal';
import {
    createImportHistoryColumns,
    type ImportJobItem,
} from './import-history-columns';

type PaginationProps = {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
};

type TableStateProps = {
    search?: string;
    sort?: string;
    direction?: 'asc' | 'desc';
    filters?: {
        type?: string;
        status?: string;
    };
};

type HistoryProps = {
    jobs: ImportJobItem[];
    pagination: PaginationProps;
    table_state?: TableStateProps;
    filters?: {
        type?: string;
        status?: string;
        search?: string;
    };
    stats: {
        total: number;
        done: number;
        failed: number;
        running: number;
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Import History', href: '/Imports/history' },
];

export default function ImportHistoryPage({
    jobs,
    pagination,
    table_state,
    filters,
    stats,
}: HistoryProps) {
    const selectedType = table_state?.filters?.type || filters?.type || 'all';
    const selectedStatus =
        table_state?.filters?.status || filters?.status || 'all';
    const currentSearch = table_state?.search || filters?.search || '';

    const [searchValue, setSearchValue] = useState(currentSearch);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [processingJobId, setProcessingJobId] = useState<number | null>(null);

    const [selectedSummary, setSelectedSummary] =
        useState<ImportSummaryData | null>(null);
    const [isSummaryOpen, setIsSummaryOpen] = useState(false);

    const initialSorting = table_state?.sort
        ? [
              {
                  id: table_state.sort,
                  desc: table_state.direction === 'desc',
              },
          ]
        : [];

    const latestQueryRef = useRef<DataTableQueryState>({
        sorting: initialSorting,
        columnFilters: [],
        globalFilter: currentSearch,
        pagination: {
            pageIndex: Math.max((pagination?.current_page ?? 1) - 1, 0),
            pageSize: pagination?.per_page ?? 15,
        },
    });

    const buildQueryParams = useCallback(
        (
            state: DataTableQueryState,
            type: string = selectedType,
            status: string = selectedStatus,
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

            if (type && type !== 'all') {
                query.type = type;
            }

            if (status && status !== 'all') {
                query.status = status;
            }

            return query;
        },
        [selectedType, selectedStatus],
    );

    const handleQueryChange = useCallback(
        (state: DataTableQueryState) => {
            latestQueryRef.current = state;
            const query = buildQueryParams(state);
            router.get('/Imports/history', query, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        },
        [buildQueryParams],
    );

    const handleSearchChange = useCallback(
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
            const query = buildQueryParams(nextState);
            router.get('/Imports/history', query, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        },
        [buildQueryParams, table_state?.search],
    );

    const handleTypeChange = (nextType: string) => {
        const nextState: DataTableQueryState = {
            ...latestQueryRef.current,
            pagination: {
                ...latestQueryRef.current.pagination,
                pageIndex: 0,
            },
        };
        latestQueryRef.current = nextState;
        const query = buildQueryParams(nextState, nextType, selectedStatus);
        router.get('/Imports/history', query, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const handleStatusChange = (nextStatus: string) => {
        const nextState: DataTableQueryState = {
            ...latestQueryRef.current,
            pagination: {
                ...latestQueryRef.current.pagination,
                pageIndex: 0,
            },
        };
        latestQueryRef.current = nextState;
        const query = buildQueryParams(nextState, selectedType, nextStatus);
        router.get('/Imports/history', query, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const handleRunNow = async (jobId: number) => {
        setProcessingJobId(jobId);
        try {
            const res = await axios.post(`/Imports/history/${jobId}/run-now`);
            if (res.data.success) {
                router.reload();
            }
        } catch (err: any) {
            alert(
                err.response?.data?.message ||
                    'Failed to process import job inline.',
            );
        } finally {
            setProcessingJobId(null);
        }
    };

    const handleViewSummary = useCallback((job: ImportJobItem) => {
        setSelectedSummary({
            id: job.id,
            type: job.type,
            status: job.status,
            message: job.message,
            context: job.context,
        });
        setIsSummaryOpen(true);
    }, []);

    const handleDeleteJob = useCallback((jobId: number, fileName: string) => {
        if (
            !confirm(
                `Are you sure you want to delete the import "${fileName}"?\n\nAll records created by this file import will be permanently removed.`,
            )
        ) {
            return;
        }

        setDeletingId(jobId);
        router.delete(`/Imports/history/${jobId}`, {
            preserveScroll: true,
            onFinish: () => setDeletingId(null),
        });
    }, []);

    const columns = useMemo(
        () =>
            createImportHistoryColumns({
                onViewSummary: handleViewSummary,
                onRunNow: handleRunNow,
                onDelete: handleDeleteJob,
                processingJobId,
                deletingId,
            }),
        [handleViewSummary, handleDeleteJob, processingJobId, deletingId],
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Import History Log" />

            <div className="space-y-6">
                {/* Top Header Card & Quick Controls */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-foreground">
                            <History className="h-7 w-7 text-primary" />
                            Import History Log
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Track all spreadsheet uploads, monitor background
                            processing, and safely revert specific import
                            batches.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.history.back()}
                            className="gap-1.5"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.reload()}
                            className="gap-1.5"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Refresh Log
                        </Button>
                    </div>
                </div>

                {/* KPI Metrics Dashboard */}
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <Card className="border-muted bg-card/50 shadow-xs backdrop-blur-xs">
                        <CardContent className="flex items-center justify-between p-4">
                            <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase">
                                    Total Imports
                                </p>
                                <p className="mt-1 text-2xl font-bold text-foreground">
                                    {stats.total}
                                </p>
                            </div>
                            <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                                <FileText className="h-5 w-5" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-muted bg-card/50 shadow-xs backdrop-blur-xs">
                        <CardContent className="flex items-center justify-between p-4">
                            <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase">
                                    Completed
                                </p>
                                <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                    {stats.done}
                                </p>
                            </div>
                            <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="h-5 w-5" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-muted bg-card/50 shadow-xs backdrop-blur-xs">
                        <CardContent className="flex items-center justify-between p-4">
                            <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase">
                                    Processing
                                </p>
                                <p className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">
                                    {stats.running}
                                </p>
                            </div>
                            <div className="rounded-xl bg-amber-500/10 p-2.5 text-amber-600 dark:text-amber-400">
                                <Clock className="h-5 w-5" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-muted bg-card/50 shadow-xs backdrop-blur-xs">
                        <CardContent className="flex items-center justify-between p-4">
                            <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase">
                                    Failed
                                </p>
                                <p className="mt-1 text-2xl font-bold text-destructive">
                                    {stats.failed}
                                </p>
                            </div>
                            <div className="rounded-xl bg-destructive/10 p-2.5 text-destructive">
                                <XCircle className="h-5 w-5" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Import History DataTable Container */}
                <Container>
                    <ContainerHeader>
                        <ContainerHeaderEnd className="w-full flex-wrap justify-between gap-4">
                            <DataTableSearch
                                value={searchValue}
                                onChange={handleSearchChange}
                                placeholder="Search by file name or message..."
                                className="w-full sm:w-80"
                            />

                            <div className="flex flex-wrap items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <Filter className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-xs font-medium text-muted-foreground">
                                        Module:
                                    </span>
                                    <Select
                                        value={selectedType}
                                        onValueChange={handleTypeChange}
                                    >
                                        <SelectTrigger className="h-9 w-[180px] bg-white text-xs">
                                            <SelectValue placeholder="All Modules" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                All Modules
                                            </SelectItem>
                                            <SelectItem value="bank_recon">
                                                Bank Reconciliation
                                            </SelectItem>
                                            <SelectItem value="planters">
                                                Planter Data
                                            </SelectItem>
                                            <SelectItem value="productions">
                                                Production Data
                                            </SelectItem>
                                            <SelectItem value="weekly">
                                                Weekly PDF Reports
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-muted-foreground">
                                        Status:
                                    </span>
                                    <Select
                                        value={selectedStatus}
                                        onValueChange={handleStatusChange}
                                    >
                                        <SelectTrigger className="h-9 w-[140px] bg-white text-xs">
                                            <SelectValue placeholder="All Statuses" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                All Statuses
                                            </SelectItem>
                                            <SelectItem value="done">
                                                Completed
                                            </SelectItem>
                                            <SelectItem value="failed">
                                                Failed
                                            </SelectItem>
                                            <SelectItem value="running">
                                                Processing
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </ContainerHeaderEnd>
                    </ContainerHeader>

                    <div className="pt-2">
                        <DataTable
                            columns={columns}
                            data={jobs}
                            serverSide
                            pageCount={pagination.last_page}
                            totalRows={pagination.total}
                            initialState={latestQueryRef.current}
                            onQueryChange={handleQueryChange}
                        />
                    </div>
                </Container>
            </div>

            <ImportSummaryModal
                isOpen={isSummaryOpen}
                onClose={() => setIsSummaryOpen(false)}
                summary={selectedSummary}
            />
        </AppLayout>
    );
}
