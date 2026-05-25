import type { ColumnDef } from '@tanstack/react-table';
import { router } from '@inertiajs/react';

import { ArrowUpDown, FileDown, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { certification as productionCertification } from '@/routes/productions';
import type { ProductionRow } from '@/components/planters/planters-table-types';

const formatPrice = (value: unknown) => {
    if (value === null || value === undefined || value === '') {
        return '-';
    }

    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric.toFixed(2) : '-';
};

export const productionYearlyColumns: ColumnDef<ProductionRow>[] = [
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
                <div className="ml-2 truncate">
                    {production.planter_code ?? '-'}
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
                <div className="ml-2 truncate">
                    {production.planter_name ?? '-'}
                </div>
            );
        },
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
            const production = row.original;
            return (
                <div className="ml-2 truncate">
                    {production.crop_year ?? '-'}
                </div>
            );
        },
    },
    {
        accessorKey: 'composite_sugar_price',
        header: 'Composite Sugar Price',
        cell: ({ row }) => {
            const production = row.original;
            return (
                <div className="ml-2 truncate">
                    {formatPrice(production.composite_sugar_price)}
                </div>
            );
        },
    },
    {
        accessorKey: 'composite_molasses_price',
        header: 'Composite Molasses Price',
        cell: ({ row }) => {
            const production = row.original;
            return (
                <div className="ml-2 truncate">
                    {formatPrice(production.composite_molasses_price)}
                </div>
            );
        },
    },
    {
        accessorKey: 'gross_cw',
        header: 'Gross CW',
        cell: ({ row }) => {
            const production = row.original;
            return (
                <div className="ml-2 truncate">
                    {Number(production.gross_cw).toFixed(2) ?? '-'}
                </div>
            );
        },
    },
    {
        accessorKey: 'net_cw',
        header: 'Net CW',
        cell: ({ row }) => {
            const production = row.original;
            return (
                <div className="ml-2 truncate">
                    {Number(production.net_cw).toFixed(2) ?? '-'}
                </div>
            );
        },
    },
    {
        accessorKey: 'trucks',
        header: 'Trucks',
        cell: ({ row }) => {
            const production = row.original;
            return (
                <div className="ml-2 truncate">{production.trucks ?? '-'}</div>
            );
        },
    },
    {
        accessorKey: 'theoretical_lkg',
        header: 'Theoretical LKG',
        cell: ({ row }) => {
            const production = row.original;
            return (
                <div className="ml-2 truncate">
                    {Number(production.theoretical_lkg).toFixed(2) ?? '-'}
                </div>
            );
        },
    },
    {
        accessorKey: 'actual_lkg',
        header: 'Actual LKG',
        cell: ({ row }) => {
            const production = row.original;
            return (
                <div className="ml-2 truncate">
                    {Number(production.actual_lkg).toFixed(2) ?? '-'}
                </div>
            );
        },
    },
    {
        accessorKey: 'pshr_net_lkg',
        header: 'PSHR Net LKG',
        cell: ({ row }) => {
            const production = row.original;
            return (
                <div className="ml-2 truncate">
                    {Number(production.pshr_net_lkg).toFixed(2) ?? '-'}
                </div>
            );
        },
    },
    {
        accessorKey: 'pdpa_lkg',
        header: 'PDPA LKG',
        cell: ({ row }) => {
            const production = row.original;
            return (
                <div className="ml-2 truncate">
                    {Number(production.pdpa_lkg).toFixed(2) ?? '-'}
                </div>
            );
        },
    },
    {
        accessorKey: 'association_dues_lkg',
        header: 'Assoc Dues LKG',
        cell: ({ row }) => {
            const production = row.original;
            return (
                <div className="ml-2 truncate">
                    {Number(production.association_dues_lkg).toFixed(2) ?? '-'}
                </div>
            );
        },
    },
    {
        accessorKey: 'actual_mol',
        header: 'Actual MOL',
        cell: ({ row }) => {
            const production = row.original;
            return (
                <div className="ml-2 truncate">
                    {Number(production.actual_mol).toFixed(2) ?? '-'}
                </div>
            );
        },
    },
    {
        accessorKey: 'pshr_net_mol',
        header: 'PSHR Net MOL',
        cell: ({ row }) => {
            const production = row.original;
            return (
                <div className="ml-2 truncate">
                    {Number(production.pshr_net_mol).toFixed(2) ?? '-'}
                </div>
            );
        },
    },
    {
        accessorKey: 'pdpa_mol',
        header: 'PDPA MOL',
        cell: ({ row }) => {
            const production = row.original;
            return (
                <div className="ml-2 truncate">
                    {Number(production.pdpa_mol).toFixed(2) ?? '-'}
                </div>
            );
        },
    },
    {
        accessorKey: 'association_dues_mol',
        header: 'Assoc Dues MOL',
        cell: ({ row }) => {
            const production = row.original;
            return (
                <div className="ml-2 truncate">
                    {Number(production.association_dues_mol).toFixed(2) ?? '-'}
                </div>
            );
        },
    },
    {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
            const production = row.original;

            return (
                <div
                    className="flex justify-center"
                    onClick={(event) => event.stopPropagation()}
                >
                    <Button
                        variant="secondary"
                        size="xs"
                        aria-label="Export yearly PDF"
                        onClick={() => {
                            const params = new URLSearchParams({
                                planter_code: production.planter_code ?? '',
                                crop_year: production.crop_year ?? '',
                            }).toString();

                            const url = `${productionCertification().url}?${params}`;

                            window.open(url, '_blank');
                        }}
                    >
                        <Printer className="mr-1 size-4" />
                        Print
                    </Button>
                </div>
            );
        },
    },
];
