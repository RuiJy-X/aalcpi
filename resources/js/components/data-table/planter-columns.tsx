//What data is shown for each column
'use client';

import { router } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';

import { ArrowUpDown, Eye, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

export type Planter = {
    id: string;
    planter_code: string;
    name: string;
    address: string;
    tin_number: string;
    contact_number: string;
    registration_date: string;
    created_at?: string;
    updated_at?: string;
};

export const planterColumns: ColumnDef<Planter>[] = [
    {
        id: 'select',
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
        accessorKey: 'planter_code',
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === 'asc')
                    }
                >
                    Planter Code
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
    },
    {
        accessorKey: 'name',
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === 'asc')
                    }
                >
                    Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => {
            const planter = row.original;

            return (
                <div className="flex items-center">
                    <div className="ml-2 truncate">{planter.name}</div>
                </div>
            );
        },
    },
    {
        accessorKey: 'address',
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === 'asc')
                    }
                >
                    Address
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => {
            const planter = row.original;

            return (
                <div className="flex items-center">
                    <div className="ml-2 truncate">{planter.address}</div>
                </div>
            );
        },
    },
    {
        accessorKey: 'tin_number',
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === 'asc')
                    }
                >
                    TIN Number
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => {
            const planter = row.original;

            return (
                <div className="flex items-center">
                    <div className="ml-2 truncate">{planter.tin_number}</div>
                </div>
            );
        },
    },
    {
        accessorKey: 'contact_number',
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === 'asc')
                    }
                >
                    Contact Number
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => {
            const planter = row.original;
            return (
                <div className="flex items-center">
                    <div className="ml-2 truncate">
                        {planter.contact_number}
                    </div>
                </div>
            );
        },
    },
    {
        accessorKey: 'registration_date',
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === 'asc')
                    }
                >
                    Registration Date
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => {
            const planter = row.original;
            return (
                <div className="flex items-center">
                    <div className="ml-2 truncate">
                        {planter.registration_date}
                    </div>
                </div>
            );
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
            const planter = row.original;
            return (
                <div className="flex items-center">
                    <div className="ml-2 truncate">
                        {planter.created_at?.split('T')[0]}
                    </div>
                </div>
            );
        },
    },
    {
        accessorKey: 'updated_at',

        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === 'asc')
                    }
                >
                    Updated At
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => {
            const planter = row.original;
            return (
                <div className="flex items-center">
                    <div className="ml-2 truncate">
                        {planter.updated_at?.split('T')[0]}
                    </div>
                </div>
            );
        },
    },

    {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
            const planter = row.original;

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
                            router.get(`/Planters/view/info/${planter.id}`)
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
