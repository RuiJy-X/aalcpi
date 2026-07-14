'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { AttendanceType } from './attendance-types';
import {
    EditableTextCell,
    type CellChangeHandler,
} from '@/components/data-table/editable-cells';

export type AttendanceColumnsOptions = {
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

export function createAttendanceColumns(
    options: AttendanceColumnsOptions = {},
): ColumnDef<AttendanceType>[] {
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
            accessorKey: 'employee.name',
            header: ({ column }) => (
                <SortHeader label="Employee Name" column={column} />
            ),
            cell: ({ row }) => (
                <div className="ml-2 truncate">
                    {row.original.employee_name ?? 'NA'}
                </div>
            ),
        },
        {
            accessorKey: 'date',
            header: ({ column }) => (
                <SortHeader label="Date" column={column} />
            ),
            cell: ({ row }) => (
                <EditableTextCell
                    rowId={row.original.id}
                    field="date"
                    isEditing={isEditing}
                    value={row.original.date}
                    display={row.original.date ?? 'NA'}
                    onCellChange={onCellChange}
                    inputType="date"
                />
            ),
        },
        {
            accessorKey: 'time_in',
            header: ({ column }) => (
                <SortHeader label="Time In" column={column} />
            ),
            cell: ({ row }) => (
                <EditableTextCell
                    rowId={row.original.id}
                    field="time_in"
                    isEditing={isEditing}
                    value={row.original.time_in}
                    display={row.original.time_in ?? 'NA'}
                    onCellChange={onCellChange}
                />
            ),
        },
        {
            accessorKey: 'time_out',
            header: ({ column }) => (
                <SortHeader label="Time Out" column={column} />
            ),
            cell: ({ row }) => (
                <EditableTextCell
                    rowId={row.original.id}
                    field="time_out"
                    isEditing={isEditing}
                    value={row.original.time_out}
                    display={row.original.time_out ?? 'NA'}
                    onCellChange={onCellChange}
                />
            ),
        },
        {
            accessorKey: 'times',
            header: ({ column }) => (
                <SortHeader label="Times" column={column} />
            ),
            cell: ({ row }) => (
                <EditableTextCell
                    rowId={row.original.id}
                    field="times"
                    isEditing={isEditing}
                    value={row.original.times}
                    display={row.original.times ?? 'NA'}
                    onCellChange={onCellChange}
                />
            ),
        },
        {
            accessorKey: 'working_time',
            header: ({ column }) => (
                <SortHeader label="Working Time" column={column} />
            ),
            cell: ({ row }) => (
                <EditableTextCell
                    rowId={row.original.id}
                    field="working_time"
                    isEditing={isEditing}
                    value={row.original.working_time}
                    display={row.original.working_time ?? 'NA'}
                    onCellChange={onCellChange}
                />
            ),
        },
    ];
}

export const attendanceColumns = createAttendanceColumns();
