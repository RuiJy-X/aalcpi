'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import type { PlanterRow } from '../planters/planters-table-types';
import PlanterActions from './planter-actions';
import {
    EditableTextCell,
    type CellChangeHandler,
} from './editable-cells';

export type PlanterColumnsOptions = {
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

export function createPlanterColumns(
    options: PlanterColumnsOptions = {},
): ColumnDef<PlanterRow>[] {
    const { isEditing = false, onCellChange } = options;

    return [
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
            accessorKey: 'planter_code',
            header: ({ column }) => (
                <SortHeader label="Planter Code" column={column} />
            ),
            cell: ({ row }) => (
                <EditableTextCell
                    rowId={row.original.id}
                    field="planter_code"
                    isEditing={isEditing}
                    value={row.original.planter_code}
                    display={row.original.planter_code ?? '-'}
                    onCellChange={onCellChange}
                />
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
            accessorKey: 'tin_number',
            header: ({ column }) => (
                <SortHeader label="TIN Number" column={column} />
            ),
            cell: ({ row }) => (
                <EditableTextCell
                    rowId={row.original.id}
                    field="tin_number"
                    isEditing={isEditing}
                    value={row.original.tin_number}
                    display={row.original.tin_number ?? '-'}
                    onCellChange={onCellChange}
                />
            ),
        },
        {
            accessorKey: 'contact_number',
            header: ({ column }) => (
                <SortHeader label="Contact Number" column={column} />
            ),
            cell: ({ row }) => (
                <EditableTextCell
                    rowId={row.original.id}
                    field="contact_number"
                    isEditing={isEditing}
                    value={row.original.contact_number}
                    display={row.original.contact_number ?? '-'}
                    onCellChange={onCellChange}
                />
            ),
        },
        {
            accessorKey: 'registration_date',
            header: ({ column }) => (
                <SortHeader label="Registration Date" column={column} />
            ),
            cell: ({ row }) => (
                <EditableTextCell
                    rowId={row.original.id}
                    field="registration_date"
                    isEditing={isEditing}
                    value={row.original.registration_date}
                    display={row.original.registration_date ?? '-'}
                    onCellChange={onCellChange}
                    inputType="date"
                />
            ),
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
            accessorKey: 'updated_at',
            header: ({ column }) => (
                <SortHeader label="Updated At" column={column} />
            ),
            cell: ({ row }) => (
                <div className="ml-2 truncate">
                    {row.original.updated_at?.split('T')[0]}
                </div>
            ),
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => <PlanterActions planter={row.original} />,
        },
    ];
}

export const planterColumns = createPlanterColumns();
