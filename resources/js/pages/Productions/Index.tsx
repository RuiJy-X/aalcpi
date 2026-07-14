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

import {
    createProductionColumns,
    type ProductionDraft,
    type ProductionEditableField,
} from '@/components/data-table/production-columns';
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
import { Pencil, Save, X } from 'lucide-react';
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
import {
    bulkUpdate as productionsBulkUpdate,
    index as productionsIndex,
    show as productionShow,
} from '@/routes/productions';
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

    const [isEditing, setIsEditing] = React.useState(false);
    const [isSaving, setIsSaving] = React.useState(false);
    const [drafts, setDrafts] = React.useState<
        Record<string, ProductionDraft>
    >({});
    // Avoid flipping serverSide on/off (that was resetting page to 1).
    const isEditingRef = React.useRef(false);
    isEditingRef.current = isEditing;
    const draftsRef = React.useRef(drafts);
    draftsRef.current = drafts;

    const numericFields = React.useMemo(
        () =>
            new Set<ProductionEditableField>([
                'composite_sugar_price',
                'composite_molasses_price',
                'gross_cw',
                'net_cw',
                'trucks',
                'theoretical_lkg',
                'actual_lkg',
                'pshr_net_lkg',
                'pdpa_lkg',
                'association_dues_lkg',
                'actual_mol',
                'pshr_net_mol',
                'pdpa_mol',
                'association_dues_mol',
            ]),
        [],
    );

    const startEditing = () => {
        const initial: Record<string, ProductionDraft> = {};

        productions.forEach((row) => {
            initial[String(row.id)] = {
                status: row.status,
                planter_code: row.planter_code ?? '',
                hacienda_code: row.hacienda_code ?? '',
                trans_code: row.trans_code ?? '',
                crop_year: row.crop_year ?? '',
                composite_sugar_price:
                    row.composite_sugar_price === null ||
                    row.composite_sugar_price === undefined
                        ? ''
                        : String(row.composite_sugar_price),
                composite_molasses_price:
                    row.composite_molasses_price === null ||
                    row.composite_molasses_price === undefined
                        ? ''
                        : String(row.composite_molasses_price),
                gross_cw: String(row.gross_cw ?? ''),
                net_cw: String(row.net_cw ?? ''),
                trucks: String(row.trucks ?? ''),
                theoretical_lkg: String(row.theoretical_lkg ?? ''),
                actual_lkg: String(row.actual_lkg ?? ''),
                pshr_net_lkg: String(row.pshr_net_lkg ?? ''),
                pdpa_lkg: String(row.pdpa_lkg ?? ''),
                association_dues_lkg: String(row.association_dues_lkg ?? ''),
                actual_mol: String(row.actual_mol ?? ''),
                pshr_net_mol: String(row.pshr_net_mol ?? ''),
                pdpa_mol: String(row.pdpa_mol ?? ''),
                association_dues_mol: String(row.association_dues_mol ?? ''),
                transloading: Boolean(row.transloading),
            };
        });

        draftsRef.current = initial;
        setDrafts(initial);
        setIsEditing(true);
    };

    const cancelEditing = () => {
        setIsEditing(false);
        draftsRef.current = {};
        setDrafts({});
    };

    const handleCellChange = React.useCallback(
        (
            productionId: string,
            field: ProductionEditableField,
            value: string | number | boolean | null,
        ) => {
            // Update ref immediately so Save always has latest values even if
            // a re-render is batched. Avoid recreating columns from drafts.
            const next = {
                ...draftsRef.current,
                [productionId]: {
                    ...(draftsRef.current[productionId] ?? {}),
                    [field]: value,
                },
            };
            draftsRef.current = next;
            setDrafts(next);
        },
        [],
    );

    // Only recreate columns when edit mode toggles — never on each keystroke.
    const productionColumns = React.useMemo(
        () =>
            createProductionColumns({
                isEditing,
                onCellChange: handleCellChange,
            }),
        [isEditing, handleCellChange],
    );

    const saveEdits = () => {
        const currentDrafts = draftsRef.current;
        const rows = Object.entries(currentDrafts).map(([id, draft]) => {
            const payload: Record<string, unknown> = { id: Number(id) };

            (
                Object.entries(draft) as [
                    ProductionEditableField,
                    string | number | boolean | null | undefined,
                ][]
            ).forEach(([field, value]) => {
                if (field === 'transloading') {
                    payload[field] = Boolean(value);
                    return;
                }

                if (field === 'status') {
                    payload[field] = value === 'completed' ? 'completed' : 'draft';
                    return;
                }

                if (numericFields.has(field)) {
                    if (value === '' || value === null || value === undefined) {
                        payload[field] = null;
                        return;
                    }

                    const numeric = Number(value);
                    payload[field] = Number.isFinite(numeric) ? numeric : null;
                    return;
                }

                payload[field] =
                    value === null || value === undefined ? null : String(value);
            });

            return payload;
        });

        if (rows.length === 0) {
            cancelEditing();
            return;
        }

        router.patch(
            productionsBulkUpdate().url,
            { rows },
            {
                preserveScroll: true,
                // Keep table UI state (current page, filters) after save.
                preserveState: true,
                onStart: () => setIsSaving(true),
                onFinish: () => setIsSaving(false),
                onSuccess: () => {
                    setIsEditing(false);
                    draftsRef.current = {};
                    setDrafts({});
                },
            },
        );
    };

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
            // Ignore table query changes while editing so page/sort don't jump.
            if (isEditingRef.current) {
                return;
            }

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
                            {!isEditing ? (
                                <Button
                                    type="button"
                                    variant="default"
                                    onClick={startEditing}
                                    disabled={productions.length === 0}
                                >
                                    <Pencil className="size-4" />
                                    Edit
                                </Button>
                            ) : (
                                <>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={cancelEditing}
                                        disabled={isSaving}
                                    >
                                        <X className="size-4" />
                                        Cancel
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={saveEdits}
                                        disabled={isSaving}
                                    >
                                        <Save className="size-4" />
                                        {isSaving ? 'Saving...' : 'Save'}
                                    </Button>
                                </>
                            )}
                            <Select
                                value={selectedCropYear}
                                onValueChange={(nextCropYear) =>
                                    applyFilters(nextCropYear)
                                }
                                disabled={isEditing}
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
                    bulkDownload={isEditing ? undefined : productionBulkDownload}
                    bulkDelete={isEditing ? undefined : productionBulkDelete}
                    onRowDoubleClick={
                        isEditing
                            ? undefined
                            : (production) => productionShow(production.id).url
                    }
                />
            </Container>
        </AppLayout>
    );
}
