'use client';

import { router } from '@inertiajs/react';
import type { ColumnDef, FilterFn } from '@tanstack/react-table';
import { ArrowUpDown, Eye, Pencil, Trash2 } from 'lucide-react';
import React from 'react';
import type { MillingPeriodRow } from '../milling-periods/milling-periods-types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    destroy as millingPeriodDelete,
    edit as millingPeriodEdit,
    show as millingPeriodShow,
} from '@/routes/MillingPeriods';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

const booleanStringFilter: FilterFn<MillingPeriodRow> = (
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

export const millingPeriodColumns: ColumnDef<MillingPeriodRow>[] = [
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
        id: 'crop_year',
        accessorKey: 'crop_year',
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(false)}
                >
                    Crop Year
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => {
            const millingPeriod = row.original;

            return (
                <div className="flex items-center">
                    <div className="ml-2 truncate">
                        {millingPeriod.crop_year}
                    </div>
                </div>
            );
        },
    },
    {
        id: 'week_no',
        accessorKey: 'week_no',
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(false)}
                >
                    Week No.
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => {
            const millingPeriod = row.original;

            return (
                <div className="flex items-center">
                    <div className="ml-2 truncate">{millingPeriod.week_no}</div>
                </div>
            );
        },
    },
    {
        id: 'start_date',
        accessorKey: 'start_date',
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(false)}
                >
                    Start Date
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => {
            const millingPeriod = row.original;

            return (
                <div className="flex items-center">
                    <div className="ml-2 truncate">
                        {millingPeriod.start_date}
                    </div>
                </div>
            );
        },
    },
    {
        id: 'end_date',
        accessorKey: 'end_date',
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(false)}
                >
                    End Date
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => {
            const millingPeriod = row.original;

            return (
                <div className="flex items-center">
                    <div className="ml-2 truncate">
                        {millingPeriod.end_date}
                    </div>
                </div>
            );
        },
    },
    {
        id: 'sugar_factor',
        accessorKey: 'sugar_factor',
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(false)}
                >
                    Sugar Factor
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => {
            const millingPeriod = row.original;

            return (
                <div className="flex items-center">
                    <div className="ml-2 truncate">
                        {Number(millingPeriod.sugar_factor)}
                    </div>
                </div>
            );
        },
    },
    {
        id: 'mol_factor',
        accessorKey: 'mol_factor',
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(false)}
                >
                    Molasses Factor
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => {
            const millingPeriod = row.original;

            return (
                <div className="flex items-center">
                    <div className="ml-2 truncate">
                        {Number(millingPeriod.mol_factor)}
                    </div>
                </div>
            );
        },
    },
    {
        id: 'sugar_price',
        accessorKey: 'sugar_price',
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(false)}
                >
                    Sugar Price / LKG
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => {
            const millingPeriod = row.original;

            return (
                <div className="flex items-center">
                    <div className="ml-2 truncate">
                        ₱ {Number(millingPeriod.sugar_price).toFixed(2)}
                    </div>
                </div>
            );
        },
    },
    {
        id: 'mol_price',
        accessorKey: 'mol_price',
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(false)}
                >
                    Molasses Price
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => {
            const millingPeriod = row.original;

            return (
                <div className="flex items-center">
                    <div className="ml-2 truncate">
                        ₱ {Number(millingPeriod.mol_price).toFixed(2)}
                    </div>
                </div>
            );
        },
    },
    {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
            const millingPeriod = row.original;
            const [isDeleteOpen, setDeleteOpen] = React.useState(false);

            const handleDelete = () => {
                router.delete(millingPeriodDelete(millingPeriod.id).url, {
                    preserveScroll: true,
                    onSuccess: () => {
                        setDeleteOpen(false);
                    },
                });
            };

            return (
                <div
                    className="flex justify-end gap-2"
                    onClick={(e) => e.stopPropagation()}
                >
                    <Button
                        variant="secondary"
                        size="xs"
                        aria-label="Preview"
                        onClick={() =>
                            router.get(millingPeriodShow(millingPeriod.id).url)
                        }
                    >
                        <Eye className="size-4" />
                    </Button>
                    <Button
                        variant="blue"
                        size="xs"
                        aria-label="Edit"
                        onClick={() =>
                            router.get(millingPeriodEdit(millingPeriod.id).url)
                        }
                    >
                        <Pencil className="size-4" />
                    </Button>
                    <Dialog open={isDeleteOpen} onOpenChange={setDeleteOpen}>
                        <DialogTrigger asChild>
                            <Button
                                variant="destructive"
                                size="xs"
                                aria-label="Delete"
                            >
                                <Trash2 className="size-4" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Delete milling period</DialogTitle>
                                <DialogDescription>
                                    This action cannot be undone. This will
                                    permanently delete the milling period
                                    record.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button variant="secondary">Cancel</Button>
                                </DialogClose>
                                <Button
                                    variant="destructive"
                                    onClick={handleDelete}
                                >
                                    Delete
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            );
        },
    },
];
