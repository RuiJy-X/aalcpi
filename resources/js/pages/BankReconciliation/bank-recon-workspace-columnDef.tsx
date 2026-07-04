'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, Pencil, Check, X, Eye, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import React from 'react';
import { Link, router, useForm } from '@inertiajs/react';
import {
    destroy as payrollDestroy,
    show as payrollShow,
} from '@/routes/payroll';
import { ReconciliationWorkspaceType } from './bank-recon-types';
import { format } from 'date-fns';

interface EditingCell {
    rowId: string | number;
    field: string;
}

export const bankReconWorkspaceColumns: ColumnDef<ReconciliationWorkspaceType>[] = [
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
        accessorKey: 'status',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === 'asc')
                }
                className="flex items-center gap-2"
            >
                Status
                <ArrowUpDown className="h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => (
            <div className="flex items-center font-semibold">
                <span>{row.getValue('status')}</span>
            </div>
        ),
    },
    // {
    //     accessorKey: 'source_id',
    //     header: ({ column }) => (
    //         <Button
    //             variant="ghost"
    //             onClick={() =>
    //                 column.toggleSorting(column.getIsSorted() === 'asc')
    //             }
    //             className="flex items-center gap-2"
    //         >
    //             Source ID
    //             <ArrowUpDown className="h-4 w-4" />
    //         </Button>
    //     ),
    //     cell: ({ row }) => (
    //         <div className="flex items-center">
    //             <span>{row.getValue('source_id')}</span>
    //         </div>
    //     ),
    // },
    // {
    //     accessorKey: 'source',
    //     header: ({ column }) => (
    //         <Button
    //             variant="ghost"
    //             onClick={() =>
    //                 column.toggleSorting(column.getIsSorted() === 'asc')
    //             }
    //             className="flex items-center gap-2"
    //         >
    //             Source
    //             <ArrowUpDown className="h-4 w-4" />
    //         </Button>
    //     ),
    //     cell: ({ row }) => (
    //         <div className="flex items-center">
    //             <span>{row.getValue('source')}</span>
    //         </div>
    //     ),
    // },

    {
        accessorKey: 'ref_no',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === 'asc')
                }
                className="flex items-center gap-2"
            >
                Check No
                <ArrowUpDown className="h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => (
            <div className="flex items-center">
                <span>{row.getValue('ref_no')}</span>
            </div>
        ),
    },
    {
        accessorKey: 'is_duplicate',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === 'asc')
                }
                className="flex items-center gap-2"
            >
                Duplicate Check ?
                <ArrowUpDown className="h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) =>
            row.original.is_duplicate ? (
                <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                    Duplicate check #
                </span>
            ) : null,
        enableColumnFilter: false,
    },
    {
        accessorKey: 'internal_source',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === 'asc')
                }
                className="flex items-center gap-2"
            >
                Internal Source
                <ArrowUpDown className="h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => (
            <div className="flex items-center">
                <span>{row.getValue('internal_source') ?? '—'}</span>
            </div>
        ),
    },
    {
        accessorKey: 'internal_date_issued',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === 'asc')
                }
                className="flex items-center gap-2"
            >
                Internal Date Issued
                <ArrowUpDown className="h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => (
            <div className="flex items-center">
                {row.getValue('internal_date_issued') ? (
                    <span>
                        {row.getValue('internal_date_issued')?.split('T')[0]}
                    </span>
                ) : (
                    <span className="font-semibold text-red-500">Null</span>
                )}
            </div>
        ),
    },
    {
        accessorKey: 'disbursement_week',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === 'asc')
                }
                className="flex items-center gap-2"
            >
                Disbursement Week
                <ArrowUpDown className="h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => (
            <div className="flex items-center">
                {row.getValue('disbursement_week') ? (
                    <span>{row.getValue('disbursement_week')}</span>
                ) : (
                    <span className="font-semibold text-red-500">Null</span>
                )}
            </div>
        ),
    },
    {
        accessorKey: 'internal_amount',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === 'asc')
                }
                className="flex items-center gap-2"
            >
                Internal Amount
                <ArrowUpDown className="h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => (
            <div className="flex items-center font-semibold">
                <span>₱{row.getValue('internal_amount')}</span>
            </div>
        ),
    },
    // seperator here
    {
        id: 'separator-space',
        size: 8,
        header: () => <div className="h-full w-4 bg-slate-50" />, // provides visual breathing room
        cell: () => <div className="h-full w-4 bg-slate-50/50" />,
        enableSorting: false,
        enableHiding: false,
    },

    {
        accessorKey: 'bank_source',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === 'asc')
                }
                className="flex items-center gap-2"
            >
                Bank Source
                <ArrowUpDown className="h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => (
            <div className="flex items-center">
                {row.getValue('bank_source') ? (
                    <span>{row.getValue('bank_source')}</span>
                ) : (
                    <span className="font-semibold text-red-500">Null</span>
                )}
            </div>
        ),
    },
    {
        accessorKey: 'bank_date',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === 'asc')
                }
                className="flex items-center gap-2"
            >
                Bank Date
                <ArrowUpDown className="h-4 w-4" />
            </Button>
        ),

        cell: ({ row }) => {
            const bankDate = row.getValue('bank_date') as Date;
            return (
                <div className="flex items-center">
                    {row.getValue('bank_date') ? (
                        <span>{format(bankDate, 'MMMM yyyy')}</span>
                    ) : (
                        <span className="font-semibold text-red-500">Null</span>
                    )}
                </div>
            );
        },
    },

    {
        accessorKey: 'transaction_date',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === 'asc')
                }
                className="flex items-center gap-2"
            >
                Transaction Date
                <ArrowUpDown className="h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => (
            <div className="flex items-center">
                {row.getValue('transaction_date') ? (
                    <span>
                        {row.getValue('transaction_date')?.split('T')[0]}
                    </span>
                ) : (
                    <span className="font-semibold text-red-500">Null</span>
                )}
            </div>
        ),
    },

    {
        accessorKey: 'description',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === 'asc')
                }
                className="flex items-center gap-2"
            >
                Description
                <ArrowUpDown className="h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => (
            <div className="flex items-center">
                <span>{row.getValue('description')}</span>
            </div>
        ),
    },

    {
        accessorKey: 'bank_amount',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === 'asc')
                }
                className="flex items-center gap-2"
            >
                Bank Amount
                <ArrowUpDown className="h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => (
            <div className="flex items-center font-semibold">
                <span>₱{row.getValue('bank_amount')}</span>
            </div>
        ),
    },
];
