import { Head, router } from '@inertiajs/react';
import type {
    ColumnFiltersState,
    PaginationState,
    SortingState,
} from '@tanstack/react-table';
import { RefreshCw, User } from 'lucide-react';
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
import PlanterStats, {
    type PlanterStatsData,
} from '@/components/planters/stat-cards/PlanterStats';
import { KpiOverview } from '@/components/kpi/kpi-card';
import {
    PeriodFilterBar,
    formatPeriodLabel,
} from '@/components/period-filter-bar';

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
    stats = {
        totalPlanters: 0,
        totalHaciendas: 0,
        totalProductions: 0,
        plantersWithHaciendas: 0,
    },
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
        period_from?: string;
        period_to?: string;
    };
    stats?: PlanterStatsData;
}) {
    type DataTableQueryState = {
        sorting: SortingState;
        columnFilters: ColumnFiltersState;
        globalFilter: string;
        pagination: PaginationState;
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

    const latestQueryRef = React.useRef<DataTableQueryState>({
        sorting: initialSorting,
        columnFilters: initialColumnFilters,
        globalFilter: table_state?.search ?? '',
        pagination: {
            pageIndex: Math.max((pagination?.current_page ?? 1) - 1, 0),
            pageSize: pagination?.per_page ?? 10,
        },
    });

    const buildQueryParams = React.useCallback(
        (
            state: DataTableQueryState,
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

            if (period?.from) {
                query.period_from = format(period.from, 'yyyy-MM-dd');
                if (period.to) {
                    query.period_to = format(period.to, 'yyyy-MM-dd');
                }
            }

            return query;
        },
        [periodRange],
    );

    const handleQueryChange = React.useCallback(
        (state: DataTableQueryState) => {
            latestQueryRef.current = state;
            const query = buildQueryParams(state);

            router.get(plantersIndex().url, query, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        },
        [buildQueryParams],
    );

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
        router.get(plantersIndex().url, buildQueryParams(nextState, nextPeriod), {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Planters">
                <title>Planters</title>
            </Head>

            <PeriodFilterBar value={periodRange} onChange={applyPeriodFilter} />

            <KpiOverview periodLabel={formatPeriodLabel(periodRange)}>
                <PlanterStats stats={stats} />
            </KpiOverview>

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
                    initialState={latestQueryRef.current}
                    onQueryChange={handleQueryChange}
                    bulkDelete={planterBulkDelete}
                    onRowDoubleClick={(planter) => planterShow(planter.id).url}
                />
            </Container>
        </AppLayout>
    );
}
