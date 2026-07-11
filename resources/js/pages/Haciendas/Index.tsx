import { Head, router } from '@inertiajs/react';
import type {
    ColumnFiltersState,
    PaginationState,
    SortingState,
} from '@tanstack/react-table';
import * as React from 'react';
import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { haciendaBulkDelete } from '@/components/data-table/bulk-delete';
import { DataTable } from '@/components/data-table/data-table';
import { haciendaColumns } from '@/components/data-table/hacienda-columns';
import type { HaciendaRow } from '@/components/planters/planters-table-types';
import AppLayout from '@/layouts/app-layout';
import { index as haciendasIndex } from '@/routes/haciendas';
import { show as haciendaShow } from '@/routes/haciendas';
import type { BreadcrumbItem } from '@/types';
import {
    Container,
    ContainerHeader,
    ContainerHeaderEnd,
} from '@/components/container';
import HaciendaStats, {
    type HaciendaStatsData,
} from '@/components/haciendas/stat-cards/HaciendaStats';
import { KpiOverview } from '@/components/kpi/kpi-card';
import {
    PeriodFilterBar,
    formatPeriodLabel,
} from '@/components/period-filter-bar';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Haciendas Management',
        href: haciendasIndex().url,
    },
];

export default function Index({
    haciendas,
    pagination,
    table_state,
    stats = {
        totalHaciendas: 0,
        totalArea: 0,
        uniquePlanters: 0,
        activeHaciendas: 0,
    },
}: {
    haciendas: HaciendaRow[];
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
    stats?: HaciendaStatsData;
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
            router.get(haciendasIndex().url, buildQueryParams(state), {
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
        router.get(
            haciendasIndex().url,
            buildQueryParams(nextState, nextPeriod),
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Haciendas"></Head>

            <PeriodFilterBar value={periodRange} onChange={applyPeriodFilter} />

            <KpiOverview periodLabel={formatPeriodLabel(periodRange)}>
                <HaciendaStats stats={stats} />
            </KpiOverview>

            <Container>
                <ContainerHeader>
                    Hacienda Table
                    <ContainerHeaderEnd />
                </ContainerHeader>
                <DataTable
                    columns={haciendaColumns}
                    data={haciendas}
                    serverSide
                    pageCount={pagination.last_page}
                    totalRows={pagination.total}
                    initialState={latestQueryRef.current}
                    onQueryChange={handleQueryChange}
                    bulkDelete={haciendaBulkDelete}
                    onRowDoubleClick={(hacienda) =>
                        haciendaShow(hacienda.id).url
                    }
                />
            </Container>
        </AppLayout>
    );
}
