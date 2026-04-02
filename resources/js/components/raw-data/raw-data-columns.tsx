//What data is shown for each column
'use client';

import type { ColumnDef } from '@tanstack/react-table';

import { ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RawDataRow } from './raw-data-types';
import RawDataActions from './rawDataActions';
import { rawDataRowKeys } from './raw-data-types';



export const rawDataColumns: ColumnDef<RawDataRow>[] = [
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
        accessorKey: 'crop_year',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === 'asc')
                }
            >
                Crop Year
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => {
            const rawData = row.original;
            return (
                <div className="flex items-center">
                    <div className="ml-2 truncate">
                        {rawData.crop_year ?? '-'}
                    </div>
                </div>
            );
        },

    },
    
    {
        accessorKey: 'planter_code',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === 'asc')
                }
            >
                Planter Code
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => {
            const rawData = row.original;
            return (
                <div className="flex items-center">
                    <div className="ml-2 truncate">
                        {rawData.planter_code ?? '-'}
                    </div>
                </div>
            );
        },
    },
    {
        accessorKey: 'date',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === 'asc')
                }
            >
                Date
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => {
            const rawData = row.original;
            return (
                <div className="flex items-center">
                    <div className="ml-2 truncate">
                        {rawData.date ?? '-'}
                    </div>
                </div>
            );
        },
    },
    {
        accessorKey: 'gross_cw',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === 'asc')
                }
            >
                Gross CW
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => {
            const rawData = row.original;
            return (
                <div className="flex items-center">
                    <div className="ml-2 truncate">
                        {rawData.gross_cw ?? '-'}
                    </div>
                </div>
            );
        },
    },
    {
        accessorKey: 'net_cw',
        header: ({ column }) => (
            <Button
            variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === 'asc')
                }
            >
                Net CW
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => {
            const rawData = row.original;
            return (
                <div className="flex items-center">
                    <div className="ml-2 truncate">
                        {rawData.net_cw ?? '-'}
                    </div>
                </div>
            );
        },
    },
    {
        accessorKey: 'trucks',
        header: ({ column }) => (
            <Button
            variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === 'asc')
                }
            >
                Trucks
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => {
            const rawData = row.original;
            return (
                <div className="flex items-center">
                    <div className="ml-2 truncate">
                        {rawData.trucks ?? '-'}
                    </div>
                </div>
            );
        },
    },
    {
        accessorKey: 'theoretical_lkg',
        header: ({ column }) => (
            <Button
            variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === 'asc')
                }
            >
                Theoretical LKG
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => {
            const rawData = row.original;
            return (
                <div className="flex items-center">
                    <div className="ml-2 truncate">
                        {rawData.theoretical_lkg ?? '-'}
                    </div>
                </div>
            );
        },
    },
    {
        accessorKey: 'actual_lkg',
        header: ({ column }) => (
            <Button
            variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === 'asc')
                }
            >
                Actual LKG
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => {
            const rawData = row.original;
            return (
                <div className="flex items-center">
                    <div className="ml-2 truncate">
                        {rawData.actual_lkg ?? '-'}
                    </div>
                </div>
            );
        },
    },

    {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
            const rawData = row.original;

            return <RawDataActions rawData={rawData} />;
        },
    },
];
