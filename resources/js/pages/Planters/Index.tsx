import { Head, router } from '@inertiajs/react';
import type {
    ColumnFiltersState,
    PaginationState,
    SortingState,
} from '@tanstack/react-table';
import { User } from 'lucide-react';
import * as React from 'react';
import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { DataTable } from '@/components/data-table/data-table';
import { planterBulkDelete } from '@/components/data-table/bulk-delete';
import { planterColumns } from '@/components/data-table/planter-columns';

import type { PlanterRow } from '@/components/planters/planters-table-types';

import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { index as plantersIndex } from '@/routes/planters';
import { create as createPage } from '@/routes/planters';
import { show as planterShow } from '@/routes/planters';
import type { BreadcrumbItem } from '@/types';
import { ImportDialog } from '@/components/import/import-dialog';
import { plantersImportConfig } from '@/components/import/import-config';
import {
    Container,
    ContainerHeader,
    ContainerHeaderEnd,
} from '@/components/container';
import PlanterCardsDisplay from '@/components/planters/planter-card-display';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Planter Management',
        href: plantersIndex().url,
    },
];

export default function Index({
    planters,
    pagination,
    table_state,
}: {
    planters: PlanterRow[];
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
    type DataTableQueryState = {
        sorting: SortingState;
        columnFilters: ColumnFiltersState;
        globalFilter: string;
        pagination: PaginationState;
        dateRange?: DateRange;
        dateFilterColumnId?: string;
    };

    const initialSorting = table_state?.sort
        ? [
              {
                  id: table_state.sort,
                  desc: table_state.direction === 'desc',
              },
          ]
        : [];
    const initialColumnFilters: DataTableQueryState['columnFilters'] =
        table_state?.filters
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
            pageSize: pagination?.per_page ?? 10,
        },
        dateRange: initialDateRange,
        dateFilterColumnId: table_state?.date_column ?? '',
    });

    const buildQueryParams = React.useCallback((state: DataTableQueryState) => {
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

        if (state.columnFilters.length > 0) {
            query.filters = {} as Record<string, string | string[]>;
            state.columnFilters.forEach((filter) => {
                if (
                    filter.value === '' ||
                    filter.value === null ||
                    filter.value === undefined
                ) {
                    return;
                }

                if (Array.isArray(filter.value)) {
                    (query.filters as Record<string, string | string[]>)[
                        filter.id
                    ] = filter.value.map((item) => String(item));
                    return;
                }

                (query.filters as Record<string, string | string[]>)[
                    filter.id
                ] = String(filter.value);
            });
        }

        if (state.dateRange?.from && state.dateFilterColumnId) {
            query.date_column = state.dateFilterColumnId;
            query.date_from = format(state.dateRange.from, 'yyyy-MM-dd');
            if (state.dateRange.to) {
                query.date_to = format(state.dateRange.to, 'yyyy-MM-dd');
            }
        }

        return query;
    }, []);

    const handleQueryChange = React.useCallback(
        (state: DataTableQueryState) => {
            const query = buildQueryParams(state);

            router.get(plantersIndex().url, query, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        },
        [buildQueryParams],
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Planters">
                <title>Planters</title>
            </Head>

            <PlanterCardsDisplay planters={planters} />

            <Container>
                <ContainerHeader>
                    Planters Table
                    <ContainerHeaderEnd>
                        <ImportDialog config={plantersImportConfig} />
                        <Button
                            variant="outline"
                            onClick={() => router.get(createPage().url)}
                        >
                            <User />
                            Register Planter
                        </Button>
                    </ContainerHeaderEnd>
                </ContainerHeader>
                <DataTable
                    columns={planterColumns}
                    data={planters}
                    serverSide
                    pageCount={pagination.last_page}
                    totalRows={pagination.total}
                    initialState={initialQueryStateRef.current}
                    onQueryChange={handleQueryChange}
                    bulkDelete={planterBulkDelete}
                    onRowDoubleClick={(planter) => planterShow(planter.id).url}
                />
            </Container>
        </AppLayout>
    );
}
