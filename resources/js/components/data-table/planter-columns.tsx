//What data is shown for each column
'use client';

import type { ColumnDef } from '@tanstack/react-table';

import { ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

import type { PlanterRow } from '../planters/planters-table-types';
import PlanterActions from './planter-actions';

export const planterColumns: ColumnDef<PlanterRow>[] = [
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
            return <PlanterActions planter={planter} />;
        },
    },
];
