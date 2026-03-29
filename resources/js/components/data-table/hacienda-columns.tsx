'use client';

import { router } from '@inertiajs/react';
import type { ColumnDef, FilterFn } from '@tanstack/react-table';
import { ArrowUpDown, Eye, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { show as haciendaShow } from '@/routes/haciendas';
import type { HaciendaRow } from '@/components/planters/planters-table-types';

const booleanStringFilter: FilterFn<HaciendaRow> = (
    row,
    columnId,
    filterValue,
) => {
    if (!filterValue) {
        return true;
    }

    if (Array.isArray(filterValue)) {
        return filterValue
            .map((value) => String(value))
            .includes(String(row.getValue(columnId)));
    }

    return String(row.getValue(columnId)) === String(filterValue);
};

export const haciendaColumns: ColumnDef<HaciendaRow>[] = [
    {
        id: 'select',
        size: 20,
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && 'indeterminate')
                }
                onCheckedChange={(value) =>
                    table.toggleAllPageRowsSelected(!!value)
                }
                aria-label="Select all"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                className="mr-2"
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: 'hacienda_code',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === 'asc')
                }
            >
                hacienda Code
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => (
            <div className="flex items-center">
                <div className="ml-2 truncate">
                    {row.original.hacienda_code}
                </div>
            </div>
        ),
    },
    {
        accessorKey: 'planter_name',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === 'asc')
                }
            >
                Planter Name
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => (
            <div className="flex items-center">
                <div className="ml-2 truncate">{row.original.planter_name}</div>
            </div>
        ),
    },
    {
        accessorKey: 'name',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === 'asc')
                }
            >
                Name
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => (
            <div className="flex items-center">
                <div className="ml-2 truncate">{row.original.name}</div>
            </div>
        ),
    },
    {
        accessorKey: 'address',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === 'asc')
                }
            >
                Address
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => (
            <div className="flex items-center">
                <div className="ml-2 truncate">{row.original.address}</div>
            </div>
        ),
    },
    {
        accessorKey: 'area_hectares',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === 'asc')
                }
            >
                Area (ha)
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => (
            <div className="flex items-center">
                <div className="ml-2 truncate">
                    {row.original.area_hectares}
                </div>
            </div>
        ),
    },
    {
        accessorKey: 'distance_from_urc',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === 'asc')
                }
            >
                Distance from URC
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => (
            <div className="flex items-center">
                <div className="ml-2 truncate">
                    {row.original.distance_from_urc}
                </div>
            </div>
        ),
    },
    {
        accessorKey: 'is_active',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === 'asc')
                }
            >
                Status
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => (
            <div className="flex items-center">
                <div className="ml-2 truncate">
                    {row.original.is_active ? 'Active' : 'Inactive'}
                </div>
            </div>
        ),
        filterFn: booleanStringFilter,

        meta: {
            label: 'Status',
            filterOptions: [
                { label: 'All', value: '' },
                { label: 'Active', value: 'true' },
                { label: 'Inactive', value: 'false' },
            ],
        },
    },
    {
        accessorKey: 'created_at',
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === 'asc')
                    }
                >
                    Created At
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => {
            const hacienda = row.original;
            return (
                <div className="flex items-center">
                    <div className="ml-2 truncate">
                        {hacienda.created_at?.split('T')[0]}
                    </div>
                </div>
            );
        },
    },
    {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
            const hacienda = row.original;

            return (
                <div
                    className="flex justify-end gap-2"
                    onClick={(e) => e.stopPropagation()}
                >
                    <Button variant="secondary" size="xs" aria-label="Preview">
                        <Eye className="size-4" />
                    </Button>
                    <Button
                        variant="blue"
                        size="xs"
                        aria-label="Edit"
                        onClick={() =>
                            router.get(haciendaShow(hacienda.id).url)
                        }
                    >
                        <Pencil className="size-4" />
                    </Button>
                    <Button variant="destructive" size="xs" aria-label="Delete">
                        <Trash2 className="size-4" />
                    </Button>
                </div>
            );
        },
    },
];
