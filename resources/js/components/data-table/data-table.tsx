'use client';
import type {
    ColumnDef,
    SortingState,
    ColumnFiltersState,
    PaginationState,
    VisibilityState,
} from '@tanstack/react-table';
import {
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    getPaginationRowModel,
    useReactTable,
    getFilteredRowModel,
} from '@tanstack/react-table';

import {
    ChevronsLeft,
    ChevronLeft,
    ChevronRight,
    ChevronsRight,
    CircleAlert,
    CircleCheckBig,
    FilterIcon,
    DownloadIcon,
    Trash2,
} from 'lucide-react';
import * as React from 'react';
import { router, usePage } from '@inertiajs/react';
import { endOfDay, format, startOfDay } from 'date-fns';
import { type DateRange } from 'react-day-picker';
import type { SharedData } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '../ui/button';
import { SearchInput } from '../ui/search-input';
// import { DataTablePagination } from './pagination';

import type { BulkDeleteConfig } from './bulk-delete';
import type { BulkDownloadConfig } from './bulk-download';
import Filter from './data-table-column-filter';
import { DatePickerWithRange } from '../date-range';

const DATE_COLUMN_PATTERN = /(?:^|_)(date|at)$/i;

function deriveColumnId<TData, TValue>(column: ColumnDef<TData, TValue>) {
    if ('id' in column && typeof column.id === 'string') {
        return column.id;
    }

    if ('accessorKey' in column && typeof column.accessorKey === 'string') {
        return column.accessorKey;
    }

    return undefined;
}

function parseDateValue(value: unknown) {
    if (value instanceof Date) {
        return isNaN(value.getTime()) ? undefined : value;
    }

    if (typeof value === 'string' || typeof value === 'number') {
        const parsed = new Date(value);
        return isNaN(parsed.getTime()) ? undefined : parsed;
    }

    return undefined;
}

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    bulkDownload?: BulkDownloadConfig<TData>;
    bulkDelete?: BulkDeleteConfig<TData>;
    onRowDoubleClick?: (row: TData) => string | null | undefined;
    excludedDateFilterColumns?: string[];
    serverSide?: boolean;
    pageCount?: number;
    totalRows?: number;
    initialState?: Partial<{
        sorting: SortingState;
        columnFilters: ColumnFiltersState;
        globalFilter: string;
        pagination: PaginationState;
        dateRange: DateRange;
        dateFilterColumnId: string;
    }>;
    onQueryChange?: (state: {
        sorting: SortingState;
        columnFilters: ColumnFiltersState;
        globalFilter: string;
        pagination: PaginationState;
        dateRange?: DateRange;
        dateFilterColumnId?: string;
    }) => void;
    queryDebounceMs?: number;
    defaultPageSize?: number;
}

export function DataTable<TData, TValue>({
    columns,
    data,
    bulkDownload,
    bulkDelete,
    onRowDoubleClick,
    excludedDateFilterColumns = [],
    serverSide = false,
    pageCount,
    totalRows,
    initialState,
    onQueryChange,
    queryDebounceMs = 300,
    defaultPageSize = 10,
}: DataTableProps<TData, TValue>) {
    const isServerSide = serverSide && Boolean(onQueryChange);
    // ======== Sorting ========
    const [sorting, setSorting] = React.useState<SortingState>(
        initialState?.sorting ?? [],
    );

    //  Search filter
    const [columnFilters, setColumnFilters] =
        React.useState<ColumnFiltersState>(initialState?.columnFilters ?? []);

    // Global search (search across all columns)
    const [globalFilter, setGlobalFilter] = React.useState(
        initialState?.globalFilter ?? '',
    );

    // Pagination
    const [pagination, setPagination] = React.useState<PaginationState>(
        initialState?.pagination ?? {
            pageIndex: 0,
            pageSize: defaultPageSize,
        },
    );

    const [activeFilters, setActiveFilters] = React.useState<string[]>([]);
    const [dateRange, setDateRange] = React.useState<DateRange | undefined>(
        initialState?.dateRange,
    );
    const [dateFilterMode, setDateFilterMode] = React.useState<
        'single' | 'range'
    >(() => (initialState?.dateRange?.to ? 'range' : 'single'));

    const dateFilterableColumns = React.useMemo(() => {
        return columns
            .map((column) => {
                const columnId = deriveColumnId(column);
                const meta = (
                    column as ColumnDef<TData, TValue> & {
                        meta?: { isDateFilter?: boolean };
                    }
                ).meta;

                return {
                    columnId,
                    isDateFilter: meta?.isDateFilter === true,
                };
            })
            .filter(({ columnId, isDateFilter }) => {
                if (!columnId) {
                    return false;
                }

                if (isDateFilter) {
                    return !excludedDateFilterColumns.includes(columnId);
                }

                return (
                    DATE_COLUMN_PATTERN.test(columnId) &&
                    !excludedDateFilterColumns.includes(columnId)
                );
            })
            .map(({ columnId }) => columnId as string);
    }, [columns, excludedDateFilterColumns]);

    const [dateFilterColumnId, setDateFilterColumnId] = React.useState<string>(
        initialState?.dateFilterColumnId ?? '',
    );

    React.useEffect(() => {
        if (!dateFilterableColumns.length) {
            setDateFilterColumnId('');
            return;
        }

        setDateFilterColumnId((currentColumnId) => {
            if (
                currentColumnId &&
                dateFilterableColumns.includes(currentColumnId)
            ) {
                return currentColumnId;
            }

            return dateFilterableColumns[0];
        });
    }, [dateFilterableColumns]);

    const filteredByDateData = React.useMemo(() => {
        if (isServerSide) {
            return data;
        }

        if (!dateRange?.from || !dateFilterColumnId) {
            return data;
        }

        const rangeStart = startOfDay(dateRange.from);
        const rangeEnd = endOfDay(dateRange.to ?? dateRange.from);

        return data.filter((row) => {
            const rowValue = (row as Record<string, unknown>)[
                dateFilterColumnId
            ];
            const parsedDate = parseDateValue(rowValue);

            if (!parsedDate) {
                return false;
            }

            return parsedDate >= rangeStart && parsedDate <= rangeEnd;
        });
    }, [data, dateRange, dateFilterColumnId, isServerSide]);

    // Column visibility

    const [columnVisibility, setColumnVisibility] =
        React.useState<VisibilityState>({});

    // Row Selection
    const [rowSelection, setRowSelection] = React.useState({});
    const [isBulkDeleteOpen, setBulkDeleteOpen] = React.useState(false);
    const [isDeleting, setIsDeleting] = React.useState(false);
    const page = usePage<SharedData>();
    const flashSuccess = page.props.flash?.success;
    const flashError = page.props.flash?.error;
    const [successMessage, setSuccessMessage] = React.useState<string | null>(
        flashSuccess ?? null,
    );
    const [errorMessage, setErrorMessage] = React.useState<string | null>(
        flashError ?? null,
    );

    React.useEffect(() => {
        if (!flashSuccess) {
            return;
        }

        setSuccessMessage(flashSuccess);

        const timeout = window.setTimeout(() => {
            setSuccessMessage(null);
        }, 5000);

        return () => window.clearTimeout(timeout);
    }, [flashSuccess]);

    React.useEffect(() => {
        if (!flashError) {
            return;
        }

        setErrorMessage(flashError);

        const timeout = window.setTimeout(() => {
            setErrorMessage(null);
        }, 7000);

        return () => window.clearTimeout(timeout);
    }, [flashError]);

    const queryState = React.useMemo(
        () => ({
            sorting,
            columnFilters,
            globalFilter,
            pagination,
            dateRange,
            dateFilterColumnId,
        }),
        [
            sorting,
            columnFilters,
            globalFilter,
            pagination,
            dateRange,
            dateFilterColumnId,
        ],
    );

    const lastQueryRef = React.useRef<{
        sorting: SortingState;
        columnFilters: ColumnFiltersState;
        globalFilter: string;
        pagination: PaginationState;
        dateRange?: DateRange;
        dateFilterColumnId?: string;
    } | null>(null);
    const skipInitialQueryRef = React.useRef(true);

    React.useEffect(() => {
        if (!isServerSide || !onQueryChange) {
            return;
        }

        if (skipInitialQueryRef.current) {
            skipInitialQueryRef.current = false;
            lastQueryRef.current = queryState;
            return;
        }

        if (
            JSON.stringify(queryState) === JSON.stringify(lastQueryRef.current)
        ) {
            return;
        }

        const columnFiltersChanged =
            JSON.stringify(queryState.columnFilters) !==
            JSON.stringify(lastQueryRef.current?.columnFilters ?? []);
        const globalFilterChanged =
            queryState.globalFilter !== lastQueryRef.current?.globalFilter;
        const shouldDebounce = columnFiltersChanged || globalFilterChanged;

        const delay = shouldDebounce ? queryDebounceMs : 0;
        const timeout = window.setTimeout(() => {
            onQueryChange(queryState);
            lastQueryRef.current = queryState;
        }, delay);

        return () => window.clearTimeout(timeout);
    }, [
        isServerSide,
        onQueryChange,
        queryState,
        queryDebounceMs,
        globalFilter,
    ]);

    React.useEffect(() => {
        if (!isServerSide) {
            return;
        }

        setPagination((current) =>
            current.pageIndex === 0 ? current : { ...current, pageIndex: 0 },
        );
    }, [
        isServerSide,
        globalFilter,
        columnFilters,
        sorting,
        dateRange,
        dateFilterColumnId,
    ]);

    const table = useReactTable({
        data: filteredByDateData,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onPaginationChange: setPagination,
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        onColumnFiltersChange: setColumnFilters,
        getFilteredRowModel: getFilteredRowModel(),
        onGlobalFilterChange: setGlobalFilter,
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        columnResizeMode: 'onChange',
        globalFilterFn: 'includesString',
        manualPagination: isServerSide,
        manualSorting: isServerSide,
        manualFiltering: isServerSide,
        pageCount: isServerSide && pageCount ? pageCount : undefined,
        state: {
            sorting,
            columnFilters,
            globalFilter,
            pagination,
            columnVisibility,
            rowSelection,
        },
    });

    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const selectedCount = selectedRows.length;
    const totalRowCount = totalRows ?? table.getFilteredRowModel().rows.length;

    const handleRowDoubleClick = React.useCallback(
        (event: React.MouseEvent<HTMLTableRowElement>, rowData: TData) => {
            if (!onRowDoubleClick) {
                return;
            }

            const target = event.target as HTMLElement;
            const interactiveParent = target.closest(
                'button, a, input, textarea, select, label, [role="checkbox"], [data-no-row-open="true"]',
            );

            if (interactiveParent) {
                return;
            }

            const destination = onRowDoubleClick(rowData);
            if (!destination) {
                return;
            }

            router.get(destination, {}, { preserveScroll: true });
        },
        [onRowDoubleClick],
    );

    const handleBulkDownload = () => {
        if (!bulkDownload || selectedCount === 0) {
            return;
        }

        const params = new URLSearchParams();
        selectedRows.forEach((row) => {
            params.append('ids[]', String(bulkDownload.getRowId(row.original)));
        });

        window.open(`${bulkDownload.endpoint}?${params.toString()}`, '_blank');
    };

    const handleBulkDelete = () => {
        if (!bulkDelete || selectedCount === 0) {
            return;
        }

        setIsDeleting(true);

        router.delete(bulkDelete.endpoint, {
            data: {
                ids: selectedRows.map((row) =>
                    bulkDelete.getRowId(row.original),
                ),
            },
            preserveScroll: true,
            onSuccess: () => {
                setRowSelection({});
                setBulkDeleteOpen(false);
            },
            onFinish: () => setIsDeleting(false),
        });
    };

    const entityLabel = bulkDelete?.entityName ?? 'record';
    const selectedEntityLabel =
        selectedCount === 1 ? entityLabel : `${entityLabel}s`;

    return (
        <div className="bg-white">
            {errorMessage && (
                <div className="border-b border-red-100 bg-red-50/80 px-4 py-4">
                    <Card className="gap-3 border-red-200 bg-red-50 py-4 shadow-none">
                        <CardHeader className="flex flex-row items-center gap-3 px-4">
                            <CircleAlert className="size-5 text-red-600" />
                            <CardTitle className="text-sm text-red-900">
                                Error
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 text-sm text-red-800">
                            {errorMessage}
                        </CardContent>
                    </Card>
                </div>
            )}
            {successMessage && (
                <div className="border-b border-emerald-100 bg-emerald-50/80 px-4 py-4">
                    <Card className="gap-3 border-emerald-200 bg-emerald-50 py-4 shadow-none">
                        <CardHeader className="flex flex-row items-center gap-3 px-4">
                            <CircleCheckBig className="size-5 text-emerald-600" />
                            <CardTitle className="text-sm text-emerald-900">
                                Success
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 text-sm text-emerald-800">
                            {successMessage}
                        </CardContent>
                    </Card>
                </div>
            )}
            <div className="align-center flex items-center gap-2 py-4">
                <div className="w-full bg-white sm:w-72">
                    <SearchInput
                        placeholder="Search all columns..."
                        value={(table.getState().globalFilter as string) ?? ''}
                        onChange={(event) =>
                            table.setGlobalFilter(event.target.value)
                        }
                        className="max-w-sm"
                    />
                </div>
                {bulkDelete && selectedCount > 0 && (
                    <Button
                        variant="destructive"
                        onClick={() => setBulkDeleteOpen(true)}
                    >
                        <Trash2 />
                        Delete ({selectedCount})
                    </Button>
                )}
                {selectedCount > 0 && (
                    <Button variant="outline" onClick={handleBulkDownload}>
                        <DownloadIcon />
                        Export ({selectedCount})
                    </Button>
                )}

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="">
                            <FilterIcon />
                            Filters
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="start"
                        className="max-h-75 overflow-y-auto"
                    >
                        {table
                            .getAllColumns()
                            .filter((column) => column.getCanFilter())
                            .map((column) => {
                                const isActive = activeFilters.includes(
                                    column.id,
                                );

                                return (
                                    <DropdownMenuCheckboxItem
                                        key={column.id}
                                        className="capitalize"
                                        onSelect={(e) => e.preventDefault()}
                                        checked={isActive}
                                        onCheckedChange={(value) => {
                                            const shouldShow = Boolean(value);

                                            setActiveFilters((prev) => {
                                                if (shouldShow) {
                                                    return prev.includes(
                                                        column.id,
                                                    )
                                                        ? prev
                                                        : [...prev, column.id];
                                                }

                                                return prev.filter(
                                                    (id) => id !== column.id,
                                                );
                                            });

                                            if (!shouldShow) {
                                                column.setFilterValue(
                                                    undefined,
                                                );
                                            }
                                        }}
                                    >
                                        {column.id}
                                    </DropdownMenuCheckboxItem>
                                );
                            })}
                    </DropdownMenuContent>
                </DropdownMenu>
                <div className="flex w-full justify-end">
                    {dateFilterableColumns.length > 0 && (
                        <div className="flex items-center gap-2">
                            {dateFilterableColumns.length > 1 && (
                                <Select
                                    value={dateFilterColumnId}
                                    onValueChange={setDateFilterColumnId}
                                >
                                    <SelectTrigger className="w-44">
                                        <SelectValue placeholder="Date field" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {dateFilterableColumns.map(
                                            (columnId) => (
                                                <SelectItem
                                                    key={columnId}
                                                    value={columnId}
                                                >
                                                    {columnId
                                                        .replaceAll('_', ' ')
                                                        .replace(/\b\w/g, (c) =>
                                                            c.toUpperCase(),
                                                        )}
                                                </SelectItem>
                                            ),
                                        )}
                                    </SelectContent>
                                </Select>
                            )}
                            <Select
                                value={dateFilterMode}
                                onValueChange={(value) => {
                                    const nextMode = value as
                                        | 'single'
                                        | 'range';

                                    setDateFilterMode(nextMode);

                                    if (nextMode === 'single') {
                                        setDateRange((current) =>
                                            current?.from
                                                ? { from: current.from }
                                                : undefined,
                                        );
                                    }
                                }}
                            >
                                <SelectTrigger className="w-36">
                                    <SelectValue placeholder="Date mode" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="single">
                                        Single date
                                    </SelectItem>
                                    <SelectItem value="range">
                                        Date range
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            {dateFilterMode === 'single' ? (
                                <Input
                                    type="date"
                                    className="w-40"
                                    value={
                                        dateRange?.from
                                            ? format(
                                                  dateRange.from,
                                                  'yyyy-MM-dd',
                                              )
                                            : ''
                                    }
                                    onChange={(event) => {
                                        const value = event.target.value;

                                        if (!value) {
                                            setDateRange(undefined);
                                            return;
                                        }

                                        const nextDate = new Date(value);
                                        if (isNaN(nextDate.getTime())) {
                                            return;
                                        }

                                        setDateRange({ from: nextDate });
                                    }}
                                />
                            ) : (
                                <DatePickerWithRange
                                    value={dateRange}
                                    onChange={setDateRange}
                                />
                            )}
                        </div>
                    )}
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="ml-auto">
                            Columns
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="end"
                        className="max-h-75 overflow-y-auto"
                    >
                        {table
                            .getAllColumns()
                            .filter((column) => column.getCanHide())
                            .map((column) => {
                                return (
                                    <DropdownMenuCheckboxItem
                                        key={column.id}
                                        className="capitalize"
                                        onSelect={(e) => e.preventDefault()}
                                        checked={column.getIsVisible()}
                                        onCheckedChange={(value) =>
                                            column.toggleVisibility(!!value)
                                        }
                                    >
                                        {column.id}
                                    </DropdownMenuCheckboxItem>
                                );
                            })}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <div className="mx-5">
                {activeFilters.length > 0 && (
                    <div className="flex flex-wrap gap-5">
                        {table.getAllColumns().map((column) => {
                            if (
                                !column.getCanFilter() ||
                                !activeFilters.includes(column.id)
                            ) {
                                return null;
                            }

                            return (
                                <Filter
                                    key={column.id}
                                    column={column}
                                    columnFilters={columnFilters}
                                    setColumnFilters={setColumnFilters}
                                />
                            );
                        })}
                    </div>
                )}
            </div>
            <div className="overflow-x-auto rounded-md border">
                <Table style={{ width: table.getTotalSize() }}>
                    <TableHeader className="bg-slate-100">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead
                                            key={header.id}
                                            className="relative border"
                                            style={{ width: header.getSize() }}
                                        >
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                      header.column.columnDef
                                                          .header,
                                                      header.getContext(),
                                                  )}
                                            <div
                                                onMouseDown={header.getResizeHandler()}
                                                onTouchStart={header.getResizeHandler()}
                                                className={`resize ${header.column.getIsResizing() ? 'isResizing' : ''}`}
                                            ></div>
                                        </TableHead>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {(isServerSide
                            ? table.getRowModel().rows
                            : table.getPaginationRowModel().rows
                        )?.length ? (
                            (isServerSide
                                ? table.getRowModel().rows
                                : table.getPaginationRowModel().rows
                            ).map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={
                                        row.getIsSelected() && 'selected'
                                    }
                                    className={`duration-150 ease-in hover:bg-green-100 ${onRowDoubleClick ? 'cursor-pointer' : ''}`}
                                    onDoubleClick={(event) =>
                                        handleRowDoubleClick(
                                            event,
                                            row.original,
                                        )
                                    }
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell
                                            key={cell.id}
                                            style={{
                                                width: cell.column.getSize(),
                                            }}
                                        >
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext(),
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={
                                        table.getVisibleLeafColumns().length
                                    }
                                    className="h-24 text-center"
                                >
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                <div className="flex flex-col gap-0">
                    <div className="mt-3 ml-3 items-center text-sm text-muted-foreground">
                        {table.getFilteredSelectedRowModel().rows.length} of{' '}
                        {totalRowCount} row(s) selected.
                    </div>
                    <div className="m-3 flex items-center justify-center space-x-2">
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center space-x-6 lg:space-x-8">
                                <div className="flex items-center space-x-2">
                                    <p className="text-sm font-medium">
                                        Rows per page
                                    </p>
                                    <Select
                                        value={`${table.getState().pagination.pageSize}`}
                                        onValueChange={(value) => {
                                            table.setPageSize(Number(value));
                                        }}
                                    >
                                        <SelectTrigger className="h-8 w-[70px]">
                                            <SelectValue
                                                placeholder={
                                                    table.getState().pagination
                                                        .pageSize
                                                }
                                            />
                                        </SelectTrigger>
                                        <SelectContent side="top">
                                            {[10, 20, 25, 30, 40, 50].map(
                                                (pageSize) => (
                                                    <SelectItem
                                                        key={pageSize}
                                                        value={`${pageSize}`}
                                                    >
                                                        {pageSize}
                                                    </SelectItem>
                                                ),
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                                    Page{' '}
                                    {table.getState().pagination.pageIndex + 1}{' '}
                                    of {table.getPageCount()}
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="hidden size-8 lg:flex"
                                        onClick={() => table.setPageIndex(0)}
                                        disabled={!table.getCanPreviousPage()}
                                    >
                                        <span className="sr-only">
                                            Go to first page
                                        </span>
                                        <ChevronsLeft />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="size-8"
                                        onClick={() => table.previousPage()}
                                        disabled={!table.getCanPreviousPage()}
                                    >
                                        <span className="sr-only">
                                            Go to previous page
                                        </span>
                                        <ChevronLeft />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="size-8"
                                        onClick={() => table.nextPage()}
                                        disabled={!table.getCanNextPage()}
                                    >
                                        <span className="sr-only">
                                            Go to next page
                                        </span>
                                        <ChevronRight />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="hidden size-8 lg:flex"
                                        onClick={() =>
                                            table.setPageIndex(
                                                table.getPageCount() - 1,
                                            )
                                        }
                                        disabled={!table.getCanNextPage()}
                                    >
                                        <span className="sr-only">
                                            Go to last page
                                        </span>
                                        <ChevronsRight />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {bulkDelete && (
                <Dialog
                    open={isBulkDeleteOpen}
                    onOpenChange={setBulkDeleteOpen}
                >
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                Delete selected {selectedEntityLabel}
                            </DialogTitle>
                            <DialogDescription>
                                This action cannot be undone. This will
                                permanently delete {selectedCount} selected{' '}
                                {selectedEntityLabel}.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button
                                    variant="secondary"
                                    disabled={isDeleting}
                                >
                                    Cancel
                                </Button>
                            </DialogClose>
                            <Button
                                variant="destructive"
                                onClick={handleBulkDelete}
                                disabled={isDeleting}
                            >
                                {isDeleting
                                    ? 'Deleting...'
                                    : `Delete ${selectedCount} selected`}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
