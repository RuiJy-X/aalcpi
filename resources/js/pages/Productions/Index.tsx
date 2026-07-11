import { Head, router } from '@inertiajs/react';
import type {
    ColumnFiltersState,
    PaginationState,
    SortingState,
} from '@tanstack/react-table';
import * as React from 'react';
import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';

import { productionBulkDelete } from '@/components/data-table/bulk-delete';
import { productionBulkDownload } from '@/components/data-table/bulk-download';
import { DataTable } from '@/components/data-table/data-table';

import { productionColumns } from '@/components/data-table/production-columns';
import type { ProductionRow } from '@/components/planters/planters-table-types';
// import PlantersTabsTable from '@/components/planters/planters-tabs-table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { index as productionsIndex } from '@/routes/productions';
import { show as productionShow } from '@/routes/productions';
import type { BreadcrumbItem } from '@/types';
import { ImportDialog } from '@/components/import/import-dialog';
import { productionsImportConfig } from '@/components/import/import-config';
import {
    Container,
    ContainerHeader,
    ContainerHeaderEnd,
} from '@/components/container';
import ProductionStats, {
    type ProductionStatsData,
} from '@/components/productions/stat-cards/ProductionStats';
import { KpiOverview } from '@/components/kpi/kpi-card';
import {
    PeriodFilterBar,
    formatPeriodLabel,
} from '@/components/period-filter-bar';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Production Management',
        href: productionsIndex().url,
    },
];

export default function Index({
    productions,
    crop_years,
    filters,
    pagination,
    table_state,
    stats = {
        totalProductions: 0,
        totalNetCw: 0,
        totalActualLkg: 0,
        totalPshrNetLkg: 0,
        totalActualMol: 0,
        totalPshrNetMol: 0,
        totalTrucks: 0,
        uniquePlanters: 0,
        totalPlanterLkgMoney: 0,
        totalPlanterMolMoney: 0,
    },
}: {
    productions: ProductionRow[];
    crop_years: string[];
    filters: {
        crop_year?: string;
    };
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
    stats?: ProductionStatsData;
}) {
    type DataTableQueryState = {
        sorting: SortingState;
        columnFilters: ColumnFiltersState;
        globalFilter: string;
        pagination: PaginationState;
    };

    const selectedCropYear =
        filters?.crop_year && filters.crop_year !== ''
            ? filters.crop_year
            : 'all';

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

    const [isDeleteCropYearOpen, setDeleteCropYearOpen] = React.useState(false);
    const [cropYearToDelete, setCropYearToDelete] = React.useState('');
    const [isDeletingByCropYear, setIsDeletingByCropYear] =
        React.useState(false);

    const buildQueryParams = React.useCallback(
        (
            state: DataTableQueryState,
            cropYear: string,
            period: DateRange | undefined = periodRange,
        ) => {
            const query: Record<string, any> = {
                page: state.pagination.pageIndex + 1,
                per_page: state.pagination.pageSize,
            };

            if (cropYear !== 'all') {
                query.crop_year = cropYear;
            }

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

    const applyFilters = (cropYear: string) => {
        const nextState = {
            ...latestQueryRef.current,
            pagination: {
                ...latestQueryRef.current.pagination,
                pageIndex: 0,
            },
        };
        latestQueryRef.current = nextState;
        const query = buildQueryParams(nextState, cropYear);

        router.get(productionsIndex().url, query, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const applyPeriodFilter = (nextPeriod: DateRange | undefined) => {
        setPeriodRange(nextPeriod);
        const nextState = {
            ...latestQueryRef.current,
            pagination: {
                ...latestQueryRef.current.pagination,
                pageIndex: 0,
            },
        };
        latestQueryRef.current = nextState;
        router.get(
            productionsIndex().url,
            buildQueryParams(nextState, selectedCropYear, nextPeriod),
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    const handleQueryChange = React.useCallback(
        (state: DataTableQueryState) => {
            latestQueryRef.current = state;
            const query = buildQueryParams(state, selectedCropYear);

            router.get(productionsIndex().url, query, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        },
        [buildQueryParams, selectedCropYear],
    );

    const handleDeleteByCropYear = () => {
        if (!cropYearToDelete) {
            return;
        }

        router.delete('/Productions/delete-by-crop-year', {
            data: {
                crop_year: cropYearToDelete,
            },
            preserveScroll: true,
            onStart: () => setIsDeletingByCropYear(true),
            onFinish: () => setIsDeletingByCropYear(false),
            onSuccess: () => {
                setDeleteCropYearOpen(false);
                setCropYearToDelete('');
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Productions"></Head>

            <PeriodFilterBar value={periodRange} onChange={applyPeriodFilter} />

            <KpiOverview periodLabel={formatPeriodLabel(periodRange)}>
                <ProductionStats stats={stats} />
            </KpiOverview>

            <Container>
                <ContainerHeader>
                    Productions Table
                    <ContainerHeaderEnd>
                        <div className="flex items-center gap-2">
                            <Select
                                value={selectedCropYear}
                                onValueChange={(nextCropYear) =>
                                    applyFilters(nextCropYear)
                                }
                            >
                                <SelectTrigger className="w-44">
                                    <SelectValue placeholder="Crop Year" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        All Crop Years
                                    </SelectItem>
                                    {crop_years.map((cropYear) => (
                                        <SelectItem
                                            key={cropYear}
                                            value={cropYear}
                                        >
                                            {cropYear}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Dialog
                                open={isDeleteCropYearOpen}
                                onOpenChange={(nextOpen) => {
                                    setDeleteCropYearOpen(nextOpen);
                                    if (nextOpen) {
                                        setCropYearToDelete(
                                            selectedCropYear !== 'all'
                                                ? selectedCropYear
                                                : '',
                                        );
                                    } else {
                                        setCropYearToDelete('');
                                    }
                                }}
                            >
                                <DialogTrigger asChild>
                                    <Button variant="destructive">
                                        Delete by crop year
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>
                                            Delete productions by crop year
                                        </DialogTitle>
                                        <DialogDescription>
                                            This will permanently delete all
                                            production rows for the selected
                                            crop year. It also clears production
                                            import mappings so they must be
                                            remapped on the next import.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-3">
                                        <Label htmlFor="delete-crop-year">
                                            Crop year
                                        </Label>
                                        <Select
                                            value={cropYearToDelete}
                                            onValueChange={(nextCropYear) =>
                                                setCropYearToDelete(
                                                    nextCropYear,
                                                )
                                            }
                                        >
                                            <SelectTrigger id="delete-crop-year">
                                                <SelectValue placeholder="Select crop year" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {crop_years.map((cropYear) => (
                                                    <SelectItem
                                                        key={cropYear}
                                                        value={cropYear}
                                                    >
                                                        {cropYear}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <DialogFooter className="gap-2">
                                        <DialogClose asChild>
                                            <Button variant="secondary">
                                                Cancel
                                            </Button>
                                        </DialogClose>
                                        <Button
                                            variant="destructive"
                                            onClick={handleDeleteByCropYear}
                                            disabled={
                                                !cropYearToDelete ||
                                                isDeletingByCropYear
                                            }
                                        >
                                            {isDeletingByCropYear
                                                ? 'Deleting...'
                                                : 'Delete'}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                        <ImportDialog config={productionsImportConfig} />
                    </ContainerHeaderEnd>
                </ContainerHeader>

                <DataTable
                    columns={productionColumns}
                    data={productions}
                    serverSide
                    pageCount={pagination.last_page}
                    totalRows={pagination.total}
                    initialState={latestQueryRef.current}
                    onQueryChange={handleQueryChange}
                    bulkDownload={productionBulkDownload}
                    bulkDelete={productionBulkDelete}
                    onRowDoubleClick={(production) =>
                        productionShow(production.id).url
                    }
                />
            </Container>
        </AppLayout>
    );
}
