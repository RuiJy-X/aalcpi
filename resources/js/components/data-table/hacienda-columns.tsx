'use client';

import { router } from '@inertiajs/react';
import type { ColumnDef, FilterFn } from '@tanstack/react-table';
import { ArrowUpDown, Eye, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { show as haciendaShow } from '@/routes/haciendas';
import type { HaciendaRow } from '@/components/planters/planters-table-types';
import {
    EditableBooleanCell,
    EditableTextCell,
    type CellChangeHandler,
} from './editable-cells';

const booleanStringFilter: FilterFn<HaciendaRow> = (
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

export type HaciendaColumnsOptions = {
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
        getIsSorted: () => false | 'asc' | 'desc';
    };
}) {
    return (
        <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
            {label}
            <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
    );
}

export function createHaciendaColumns(
    options: HaciendaColumnsOptions = {},
): ColumnDef<HaciendaRow>[] {
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
            accessorKey: 'hacienda_code',
            header: ({ column }) => (
                <SortHeader label="Hacienda Code" column={column} />
            ),
            cell: ({ row }) => (
                <EditableTextCell
                    rowId={row.original.id}
                    field="hacienda_code"
                    isEditing={isEditing}
                    value={row.original.hacienda_code}
                    display={row.original.hacienda_code ?? '-'}
                    onCellChange={onCellChange}
                />
            ),
        },
        {
            accessorKey: 'planter_name',
            header: ({ column }) => (
                <SortHeader label="Planter Name" column={column} />
            ),
            cell: ({ row }) => (
                <div className="ml-2 truncate">
                    {row.original.planter_name ?? '-'}
                </div>
            ),
        },
        {
            accessorKey: 'name',
            header: ({ column }) => (
                <SortHeader label="Name" column={column} />
            ),
            cell: ({ row }) => (
                <EditableTextCell
                    rowId={row.original.id}
                    field="name"
                    isEditing={isEditing}
                    value={row.original.name}
                    display={row.original.name ?? '-'}
                    onCellChange={onCellChange}
                />
            ),
        },
        {
            accessorKey: 'address',
            header: ({ column }) => (
                <SortHeader label="Address" column={column} />
            ),
            cell: ({ row }) => (
                <EditableTextCell
                    rowId={row.original.id}
                    field="address"
                    isEditing={isEditing}
                    value={row.original.address}
                    display={row.original.address ?? '-'}
                    onCellChange={onCellChange}
                />
            ),
        },
        {
            accessorKey: 'area_hectares',
            header: ({ column }) => (
                <SortHeader label="Area (ha)" column={column} />
            ),
            cell: ({ row }) => (
                <EditableTextCell
                    rowId={row.original.id}
                    field="area_hectares"
                    isEditing={isEditing}
                    value={row.original.area_hectares}
                    display={row.original.area_hectares ?? '-'}
                    onCellChange={onCellChange}
                    inputType="number"
                />
            ),
        },
        {
            accessorKey: 'distance_from_urc',
            header: ({ column }) => (
                <SortHeader label="Distance from URC" column={column} />
            ),
            cell: ({ row }) => (
                <EditableTextCell
                    rowId={row.original.id}
                    field="distance_from_urc"
                    isEditing={isEditing}
                    value={row.original.distance_from_urc}
                    display={row.original.distance_from_urc ?? '-'}
                    onCellChange={onCellChange}
                    inputType="number"
                />
            ),
        },
        {
            accessorKey: 'is_active',
            header: ({ column }) => (
                <SortHeader label="Status" column={column} />
            ),
            cell: ({ row }) => (
                <EditableBooleanCell
                    rowId={row.original.id}
                    field="is_active"
                    isEditing={isEditing}
                    value={row.original.is_active}
                    trueLabel="Active"
                    falseLabel="Inactive"
                    onCellChange={onCellChange}
                />
            ),
            filterFn: booleanStringFilter,
            meta: {
                label: 'Status',
                filterOptions: [
                    { label: 'All', value: '' },
                    { label: 'Active', value: 'true' },
                    { label: 'Inactive', value: 'false' },
                ],
            },
        },
        {
            accessorKey: 'created_at',
            header: ({ column }) => (
                <SortHeader label="Created At" column={column} />
            ),
            cell: ({ row }) => (
                <div className="ml-2 truncate">
                    {row.original.created_at?.split('T')[0]}
                </div>
            ),
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => {
                const hacienda = row.original;

                return (
                    <div
                        className="flex justify-end gap-2"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Button
                            variant="secondary"
                            size="xs"
                            aria-label="Preview"
                        >
                            <Eye className="size-4" />
                        </Button>
                        <Button
                            variant="blue"
                            size="xs"
                            aria-label="Edit"
                            onClick={() =>
                                router.get(haciendaShow(hacienda.id).url)
                            }
                        >
                            <Pencil className="size-4" />
                        </Button>
                        <Button
                            variant="destructive"
                            size="xs"
                            aria-label="Delete"
                        >
                            <Trash2 className="size-4" />
                        </Button>
                    </div>
                );
            },
        },
    ];
}

export const haciendaColumns = createHaciendaColumns();
