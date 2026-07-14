'use client';

import { router } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, Eye, Pencil, Trash2 } from 'lucide-react';
import React from 'react';
import type { MillingPeriodRow } from '../milling-periods/milling-periods-types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    destroy as millingPeriodDelete,
    edit as millingPeriodEdit,
    show as millingPeriodShow,
} from '@/routes/milling-periods';
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
import {
    EditableTextCell,
    type CellChangeHandler,
} from '@/components/data-table/editable-cells';

export type MillingPeriodColumnsOptions = {
    isEditing?: boolean;
    onCellChange?: CellChangeHandler;
};

function SortHeader({
    label,
    column,
}: {
    label: string;
    column: {
        toggleSorting: (desc?: boolean) => void;
    };
}) {
    return (
        <Button variant="ghost" onClick={() => column.toggleSorting(false)}>
            {label}
            <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
    );
}

export function createMillingPeriodColumns(
    options: MillingPeriodColumnsOptions = {},
): ColumnDef<MillingPeriodRow>[] {
    const { isEditing = false, onCellChange } = options;

    return [
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
            header: ({ column }) => (
                <SortHeader label="Crop Year" column={column} />
            ),
            cell: ({ row }) => (
                <EditableTextCell
                    rowId={row.original.id}
                    field="crop_year"
                    isEditing={isEditing}
                    value={row.original.crop_year}
                    display={row.original.crop_year}
                    onCellChange={onCellChange}
                />
            ),
        },
        {
            id: 'week_no',
            accessorKey: 'week_no',
            header: ({ column }) => (
                <SortHeader label="Week No." column={column} />
            ),
            cell: ({ row }) => (
                <EditableTextCell
                    rowId={row.original.id}
                    field="week_no"
                    isEditing={isEditing}
                    value={row.original.week_no}
                    display={row.original.week_no}
                    onCellChange={onCellChange}
                    inputType="number"
                />
            ),
        },
        {
            id: 'start_date',
            accessorKey: 'start_date',
            header: ({ column }) => (
                <SortHeader label="Start Date" column={column} />
            ),
            cell: ({ row }) => (
                <EditableTextCell
                    rowId={row.original.id}
                    field="start_date"
                    isEditing={isEditing}
                    value={row.original.start_date}
                    display={row.original.start_date}
                    onCellChange={onCellChange}
                    inputType="date"
                />
            ),
        },
        {
            id: 'end_date',
            accessorKey: 'end_date',
            header: ({ column }) => (
                <SortHeader label="End Date" column={column} />
            ),
            cell: ({ row }) => (
                <EditableTextCell
                    rowId={row.original.id}
                    field="end_date"
                    isEditing={isEditing}
                    value={row.original.end_date}
                    display={row.original.end_date}
                    onCellChange={onCellChange}
                    inputType="date"
                />
            ),
        },
        {
            id: 'sugar_factor',
            accessorKey: 'sugar_factor',
            header: ({ column }) => (
                <SortHeader label="Sugar Factor" column={column} />
            ),
            cell: ({ row }) => (
                <EditableTextCell
                    rowId={row.original.id}
                    field="sugar_factor"
                    isEditing={isEditing}
                    value={row.original.sugar_factor}
                    display={Number(row.original.sugar_factor)}
                    onCellChange={onCellChange}
                    inputType="number"
                />
            ),
        },
        {
            id: 'mol_factor',
            accessorKey: 'mol_factor',
            header: ({ column }) => (
                <SortHeader label="Molasses Factor" column={column} />
            ),
            cell: ({ row }) => (
                <EditableTextCell
                    rowId={row.original.id}
                    field="mol_factor"
                    isEditing={isEditing}
                    value={row.original.mol_factor}
                    display={Number(row.original.mol_factor)}
                    onCellChange={onCellChange}
                    inputType="number"
                />
            ),
        },
        {
            id: 'sugar_price',
            accessorKey: 'sugar_price',
            header: ({ column }) => (
                <SortHeader label="Sugar Price / LKG" column={column} />
            ),
            cell: ({ row }) => (
                <EditableTextCell
                    rowId={row.original.id}
                    field="sugar_price"
                    isEditing={isEditing}
                    value={row.original.sugar_price}
                    display={`₱ ${Number(row.original.sugar_price).toFixed(2)}`}
                    onCellChange={onCellChange}
                    inputType="number"
                />
            ),
        },
        {
            id: 'mol_price',
            accessorKey: 'mol_price',
            header: ({ column }) => (
                <SortHeader label="Molasses Price" column={column} />
            ),
            cell: ({ row }) => (
                <EditableTextCell
                    rowId={row.original.id}
                    field="mol_price"
                    isEditing={isEditing}
                    value={row.original.mol_price}
                    display={`₱ ${Number(row.original.mol_price).toFixed(2)}`}
                    onCellChange={onCellChange}
                    inputType="number"
                />
            ),
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
                        onSuccess: () => setDeleteOpen(false),
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
                                router.get(
                                    millingPeriodShow(millingPeriod.id).url,
                                )
                            }
                        >
                            <Eye className="size-4" />
                        </Button>
                        <Button
                            variant="blue"
                            size="xs"
                            aria-label="Edit"
                            onClick={() =>
                                router.get(
                                    millingPeriodEdit(millingPeriod.id).url,
                                )
                            }
                        >
                            <Pencil className="size-4" />
                        </Button>
                        <Dialog
                            open={isDeleteOpen}
                            onOpenChange={setDeleteOpen}
                        >
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
                                    <DialogTitle>
                                        Delete milling period
                                    </DialogTitle>
                                    <DialogDescription>
                                        This action cannot be undone. This will
                                        permanently delete the milling period
                                        record.
                                    </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                    <DialogClose asChild>
                                        <Button variant="secondary">
                                            Cancel
                                        </Button>
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
}

export const millingPeriodColumns = createMillingPeriodColumns();
