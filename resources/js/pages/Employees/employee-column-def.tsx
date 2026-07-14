'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import type { EmployeeType } from './employeeTypes';
import EmployeeActions from '@/pages/Employees/employee-actions';
import {
    EditableTextCell,
    type CellChangeHandler,
} from '@/components/data-table/editable-cells';

export type EmployeeColumnsOptions = {
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

export function createEmployeeColumns(
    options: EmployeeColumnsOptions = {},
): ColumnDef<EmployeeType>[] {
    const { isEditing = false, onCellChange } = options;

    const text = (
        field: string,
        label: string,
        getValue: (e: EmployeeType) => unknown,
        inputType: 'text' | 'number' = 'text',
    ): ColumnDef<EmployeeType> => ({
        accessorKey: field,
        header: ({ column }) => <SortHeader label={label} column={column} />,
        cell: ({ row }) => (
            <EditableTextCell
                rowId={row.original.id}
                field={field}
                isEditing={isEditing}
                value={getValue(row.original)}
                display={String(getValue(row.original) ?? 'NA')}
                onCellChange={onCellChange}
                inputType={inputType}
            />
        ),
    });

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
        text('employee_code', 'Employee Code', (e) => e.employee_code),
        text('name', 'Name', (e) => e.name),
        text('position', 'Position', (e) => e.position),
        text('department', 'Department', (e) => e.department),
        text('employment_type', 'Employment Type', (e) => e.employment_type),
        text('base_salary', 'Base Salary', (e) => e.base_salary, 'number'),
        text('hourly_rate', 'Hourly Rate', (e) => e.hourly_rate, 'number'),
        text('contact_number', 'Contact Number', (e) => e.contact_number),
        text('address', 'Address', (e) => e.address),
        text('tin', 'TIN', (e) => e.tin),
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => <EmployeeActions employee={row.original} />,
        },
    ];
}

export const employeeColumns = createEmployeeColumns();
