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
        accessorKey: 'source_id',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === 'asc')
                }
                className="flex items-center gap-2"
            >
                Source ID
                <ArrowUpDown className="h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => (
            <div className="flex items-center">
                <span>{row.getValue('source_id')}</span>
            </div>
        ),
    },
    {
        accessorKey: 'source',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === 'asc')
                }
                className="flex items-center gap-2"
            >
                Source
                <ArrowUpDown className="h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => (
            <div className="flex items-center">
                <span>{row.getValue('source')}</span>
            </div>
        ),
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
                <span>{row.getValue('bank_source') ?? '—'}</span>
            </div>
        ),
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
                <span>{row.getValue('transaction_date')}</span>
            </div>
        ),
    },
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
                Reference No
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
            <div className="flex items-center">
                <span>{row.getValue('internal_amount')}</span>
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
            <div className="flex items-center">
                <span>{row.getValue('bank_amount')}</span>
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
                className="flex items-center gap-2"
            >
                Status
                <ArrowUpDown className="h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => (
            <div className="flex items-center">
                <span>{row.getValue('status')}</span>
            </div>
        ),
    },
];
