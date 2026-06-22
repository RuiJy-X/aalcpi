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

import { index as bankReconciliationIndex } from '@/routes/bank_reconciliation';

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
    statuses=[],
    pagination,
    table_state,
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
    };
}) {
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
            ? statusFilter[0] ?? 'all'
            : statusFilter;
    }, [table_state?.filters?.status]);

    const buildQueryParams = React.useCallback(
    (state: DataTableQueryState, status: string) => {
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
            if (filter.id === 'status') {
                return; // status is handled separately, not via columnFilters
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

        return query;
    },
    [],
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Bank Reconciliation" />
            <Container>
                <ContainerHeader>
                    Bank Reconciliation
                    <ContainerHeaderEnd>
                        <Select
                            value={selectedStatus}
                            onValueChange={(nextStatus) =>
                                applyStatusFilter(nextStatus)
                            }
                        >
                            <SelectTrigger className="w-44">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    All Statuses
                                </SelectItem>
                                {statuses.map((status) => (
                                    <SelectItem key={status} value={status}>
                                        {formatStatusLabel(status)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <BankReconImportDialog />
                    </ContainerHeaderEnd>
                </ContainerHeader>

                <DataTable
                    columns={bankReconWorkspaceColumns}
                    data={reconciliationWorkspaces}
                    serverSide
                    pageCount={pagination.last_page}
                    totalRows={pagination.total}
                    initialState={initialQueryStateRef.current}
                    onQueryChange={handleQueryChange}
                />
            </Container>
        </AppLayout>
    );
}