//What data is shown for each column
'use client';

import type { ColumnDef } from '@tanstack/react-table';

import { ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import ProductionActions from './production-actions';

export type ProductionRow = {
    id: string;
    planter_name: string;
    land_name: string;
    land_address: string;
    planter_id: string;
    land_id: string;
    production_year: number;
    production_month: number;
    gross_cw: number;
    net_cw: number;
    trucks: number;
    theoretical_lkg: number;
    actual_lkg: number;
    pshr_net_lkg: number;
    pdpa_lkg: number;
    association_dues_lkg: number;
    actual_mol: number;
    pshr_net_mol: number;
    pdpa_mol: number;
    association_dues_mol: number;
    trans_code?: string | null;
    transloading?: boolean | null;
};

export const productionColumns: ColumnDef<ProductionRow>[] = [
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
        cell: ({ row }) => {
            const production = row.original;
            return (
                <div className="flex items-center">
                    <div className="ml-2 truncate">
                        {production.planter_name ?? '-'}
                    </div>
                </div>
            );
        },
    },
    {
        accessorKey: 'land_name',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === 'asc')
                }
            >
                Land Name
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => {
            const production = row.original;
            return (
                <div className="flex items-center">
                    <div className="ml-2 truncate">
                        {production.land_name ?? '-'}
                    </div>
                </div>
            );
        },
    },
    {
        accessorKey: 'land_address',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === 'asc')
                }
            >
                Land Address
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => {
            const production = row.original;
            return (
                <div className="flex items-center">
                    <div className="ml-2 truncate">
                        {production.land_address ?? '-'}
                    </div>
                </div>
            );
        },
    },
    {
        accessorKey: 'trans_code',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === 'asc')
                }
            >
                Trans Code
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => {
            const production = row.original;
            return (
                <div className="flex items-center">
                    <div className="ml-2 truncate">
                        {production.trans_code ?? '-'}
                    </div>
                </div>
            );
        },
    },

    {
        accessorKey: 'production_year',
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === 'asc')
                    }
                >
                    Year
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => {
            const production = row.original;

            return (
                <div className="flex items-center">
                    <div className="ml-2 truncate">
                        {production.production_year}
                    </div>
                </div>
            );
        },
    },
    {
        accessorKey: 'production_month',
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === 'asc')
                    }
                >
                    Month
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => {
            const production = row.original;

            return (
                <div className="flex items-center">
                    <div className="ml-2 truncate">
                        {production.production_month}
                    </div>
                </div>
            );
        },
    },
    {
        accessorKey: 'gross_cw',
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === 'asc')
                    }
                >
                    Gross CW
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => {
            const production = row.original;
            return (
                <div className="flex items-center">
                    <div className="ml-2 truncate">{production.gross_cw}</div>
                </div>
            );
        },
    },
    {
        accessorKey: 'net_cw',
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === 'asc')
                    }
                >
                    Net CW
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => {
            const production = row.original;
            return (
                <div className="flex items-center">
                    <div className="ml-2 truncate">{production.net_cw}</div>
                </div>
            );
        },
    },
    {
        accessorKey: 'trucks',
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === 'asc')
                    }
                >
                    Trucks
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => {
            const production = row.original;
            return (
                <div className="flex items-center">
                    <div className="ml-2 truncate">{production.trucks}</div>
                </div>
            );
        },
    },
    {
        accessorKey: 'theoretical_lkg',
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === 'asc')
                    }
                >
                    Theoretical LKG
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => {
            const production = row.original;
            return (
                <div className="flex items-center">
                    <div className="ml-2 truncate">
                        {production.theoretical_lkg}
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
            const production = row.original;
            return (
                <div className="flex items-center">
                    <div className="ml-2 truncate">{production.actual_lkg}</div>
                </div>
            );
        },
    },
    {
        accessorKey: 'pshr_net_lkg',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === 'asc')
                }
            >
                PSHR Net LKG
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => {
            const production = row.original;
            return (
                <div className="flex items-center">
                    <div className="ml-2 truncate">
                        {production.pshr_net_lkg}
                    </div>
                </div>
            );
        },
    },
    {
        accessorKey: 'pdpa_lkg',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === 'asc')
                }
            >
                PDPA LKG
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => {
            const production = row.original;
            return (
                <div className="flex items-center">
                    <div className="ml-2 truncate">{production.pdpa_lkg}</div>
                </div>
            );
        },
    },
    {
        accessorKey: 'association_dues_lkg',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === 'asc')
                }
            >
                Assoc Dues LKG
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => {
            const production = row.original;
            return (
                <div className="flex items-center">
                    <div className="ml-2 truncate">
                        {production.association_dues_lkg}
                    </div>
                </div>
            );
        },
    },
    {
        accessorKey: 'actual_mol',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === 'asc')
                }
            >
                Actual MOL
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => {
            const production = row.original;
            return (
                <div className="flex items-center">
                    <div className="ml-2 truncate">{production.actual_mol}</div>
                </div>
            );
        },
    },
    {
        accessorKey: 'pshr_net_mol',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === 'asc')
                }
            >
                PSHR Net MOL
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => {
            const production = row.original;
            return (
                <div className="flex items-center">
                    <div className="ml-2 truncate">
                        {production.pshr_net_mol}
                    </div>
                </div>
            );
        },
    },
    {
        accessorKey: 'pdpa_mol',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === 'asc')
                }
            >
                PDPA MOL
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => {
            const production = row.original;
            return (
                <div className="flex items-center">
                    <div className="ml-2 truncate">{production.pdpa_mol}</div>
                </div>
            );
        },
    },
    {
        accessorKey: 'association_dues_mol',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === 'asc')
                }
            >
                Assoc Dues MOL
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => {
            const production = row.original;
            return (
                <div className="flex items-center">
                    <div className="ml-2 truncate">
                        {production.association_dues_mol}
                    </div>
                </div>
            );
        },
    },

    {
        accessorKey: 'transloading',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === 'asc')
                }
            >
                Transloading
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => {
            const production = row.original;
            const value = production.transloading;

            return (
                <div className="flex items-center">
                    <div className="ml-2 truncate">
                        {value === null || value === undefined
                            ? '-'
                            : value
                              ? 'Yes'
                              : 'No'}
                    </div>
                </div>
            );
        },
        filterFn: (row, columnId, filterValue) => {
            const rowValue = row.getValue(columnId);
            if (!filterValue) {
                return true;
            }

            if (Array.isArray(filterValue)) {
                return filterValue
                    .map((value) => String(value))
                    .includes(String(rowValue));
            }

            return String(rowValue) === String(filterValue);
        },
        meta: {
            label: 'Transloading',
            filterOptions: [
                { label: 'All', value: '' },
                { label: 'Yes', value: 'true' },
                { label: 'No', value: 'false' },
            ],
        },
    },

    {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
            const production = row.original;

            return <ProductionActions production={production} />;
        },
    },
];
