//What data is shown for each column
'use client';

import type { ColumnDef } from '@tanstack/react-table';

import { ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import ProductionActions from './production-actions';
import type { ProductionRow } from '@/components/planters/planters-table-types';

const formatPrice = (value: unknown) => {
    if (value === null || value === undefined || value === '') {
        return '-';
    }

    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric.toFixed(2) : '-';
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
            const production = row.original;
            return (
                <div className="flex items-center">
                    <div className="ml-2 truncate">
                        {production.planter_code ?? '-'}
                    </div>
                </div>
            );
        },
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
        cell: ({ row }) => {
            const production = row.original;
            return (
                <div className="flex items-center">
                    <div className="ml-2 truncate">
                        {production.hacienda_code ?? '-'}
                    </div>
                </div>
            );
        },
    },
    {
        accessorKey: 'hacienda_name',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === 'asc')
                }
            >
                hacienda Name
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => {
            const production = row.original;
            return (
                <div className="flex items-center">
                    <div className="ml-2 truncate">
                        {production.hacienda_name ?? '-'}
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
        accessorKey: 'crop_year',
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === 'asc')
                    }
                >
                    Crop Year
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => {
            const production = row.original;

            return (
                <div className="flex items-center">
                    <div
                        className={`ml-2 truncate ${production.crop_year ? '' : 'text-red-500'}`}
                    >
                        {production.crop_year ?? 'No crop year assigned'}
                    </div>
                </div>
            );
        },
    },
    {
        accessorKey: 'composite_sugar_price',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === 'asc')
                }
            >
                Composite Sugar Price
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => {
            const production = row.original;
            return (
                <div className="flex items-center">
                    <div className="ml-2 truncate">
                        {formatPrice(production.composite_sugar_price)}
                    </div>
                </div>
            );
        },
    },
    {
        accessorKey: 'composite_molasses_price',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === 'asc')
                }
            >
                Composite Molasses Price
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => {
            const production = row.original;
            return (
                <div className="flex items-center">
                    <div className="ml-2 truncate">
                        {formatPrice(production.composite_molasses_price)}
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
                    <div className="ml-2 truncate">
                        {Number(production.gross_cw).toFixed(2)}
                    </div>
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
                    <div className="ml-2 truncate">
                        {Number(production.net_cw).toFixed(2)}
                    </div>
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
                        {Number(production.theoretical_lkg).toFixed(2)}
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
                    <div className="ml-2 truncate">
                        {Number(production.actual_lkg).toFixed(2)}
                    </div>
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
                        {Number(production.pshr_net_lkg).toFixed(2)}
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
                    <div className="ml-2 truncate">
                        {Number(production.pdpa_lkg).toFixed(2)}
                    </div>
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
                        {Number(production.association_dues_lkg).toFixed(2)}
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
                    <div className="ml-2 truncate">
                        {Number(production.actual_mol).toFixed(2)}
                    </div>
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
                        {Number(production.pshr_net_mol).toFixed(2)}
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
                    <div className="ml-2 truncate">
                        {Number(production.pdpa_mol).toFixed(2)}
                    </div>
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
                        {Number(production.association_dues_mol).toFixed(2)}
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
            const production = row.original;
            return (
                <div className="flex items-center">
                    <div className="ml-2 truncate">
                        {production.created_at?.split('T')[0]}
                    </div>
                </div>
            );
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
