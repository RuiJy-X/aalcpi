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
    CircleCheckBig,
    FilterIcon,
} from 'lucide-react';
import * as React from 'react';
import { router, usePage } from '@inertiajs/react';
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
import Filter from './data-table-column-filter';

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    bulkDelete?: BulkDeleteConfig<TData>;
}

export function DataTable<TData, TValue>({
    columns,
    data,
    bulkDelete,
}: DataTableProps<TData, TValue>) {
    // ======== Sorting ========
    const [sorting, setSorting] = React.useState<SortingState>([]);

    //  Search filter
    const [columnFilters, setColumnFilters] =
        React.useState<ColumnFiltersState>([]);

    // Global search (search across all columns)
    const [globalFilter, setGlobalFilter] = React.useState('');

    // Pagination
    const [pagination, setPagination] = React.useState<PaginationState>({
        pageIndex: 0,
        pageSize: 10,
    });

    const [activeFilters, setActiveFilters] = React.useState<string[]>([]);

    // Column visibility

    const [columnVisibility, setColumnVisibility] =
        React.useState<VisibilityState>({});

    // Row Selection
    const [rowSelection, setRowSelection] = React.useState({});
    const [isBulkDeleteOpen, setBulkDeleteOpen] = React.useState(false);
    const [isDeleting, setIsDeleting] = React.useState(false);
    const page = usePage<SharedData>();
    const flashSuccess = page.props.flash?.success;
    const [successMessage, setSuccessMessage] = React.useState<string | null>(
        flashSuccess ?? null,
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

    const table = useReactTable({
        data,
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
        <div className="rounded-md border bg-white">
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
            <div className="align-center flex items-center gap-2 px-4 py-4">
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
                        Delete selected ({selectedCount})
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
                    <TableHeader className="bg-gray-100">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead
                                            key={header.id}
                                            className="relative border border-gray-300"
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
                        {table.getPaginationRowModel().rows?.length ? (
                            table.getPaginationRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={
                                        row.getIsSelected() && 'selected'
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
                        {table.getFilteredRowModel().rows.length} row(s)
                        selected.
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
