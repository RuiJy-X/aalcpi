'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, Eye, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { router } from '@inertiajs/react';

export type CertificationRow = {
    id: string;
    planter_id: string;
    land_id: string;
    production_id: string;
    certification_type: string;
    issue_date: string;
    status: string;
};

export const certificationColumns: ColumnDef<CertificationRow>[] = [
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
        accessorKey: 'certification_type',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === 'asc')
                }
            >
                Certification Type
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => (
            <div className="flex items-center">
                <div className="ml-2 truncate">
                    {row.original.certification_type}
                </div>
            </div>
        ),
    },
    {
        accessorKey: 'issue_date',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === 'asc')
                }
            >
                Issue Date
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => (
            <div className="flex items-center">
                <div className="ml-2 truncate">{row.original.issue_date}</div>
            </div>
        ),
    },
    {
        accessorKey: 'status',
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
                <div className="ml-2 truncate">{row.original.status}</div>
            </div>
        ),
    },
    {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
            const certificate = row.original;

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
                            router.get(
                                `/Planters/view/info/${certificate.planter_id}/certificate/${certificate.id}`,
                            )
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
