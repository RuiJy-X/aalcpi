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

const formatCurrency = (val: unknown, isDeduction: boolean = false) => {
    const num = parseFloat(String(val ?? 0));
    if (isNaN(num)) return isDeduction ? '-₱0.00' : '₱0.00';
    const formatted = `₱${num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return isDeduction && num > 0 ? `-${formatted}` : formatted;
};

export function createEmployeeColumns(
    options: EmployeeColumnsOptions = {},
): ColumnDef<EmployeeType>[] {
    const { isEditing = false, onCellChange } = options;

    const text = (
        field: string,
        label: string,
        getValue: (e: EmployeeType) => unknown,
        inputType: 'text' | 'number' = 'text',
        isMoney: boolean = false,
        isDeduction: boolean = false,
        isEarnings: boolean = false,
    ): ColumnDef<EmployeeType> => ({
        accessorKey: field,
        header: ({ column }) => <SortHeader label={label} column={column} />,
        cell: ({ row }) => {
            const displayVal = isMoney
                ? formatCurrency(getValue(row.original), isDeduction)
                : String(getValue(row.original) ?? 'N/A');

            return (
                <div
                    className={
                        isDeduction
                            ? 'font-semibold text-rose-600 dark:text-rose-400'
                            : isEarnings
                            ? 'font-bold text-emerald-600 dark:text-emerald-400'
                            : ''
                    }
                >
                    <EditableTextCell
                        rowId={row.original.id}
                        field={field}
                        isEditing={isEditing}
                        value={getValue(row.original)}
                        display={displayVal}
                        onCellChange={onCellChange}
                        inputType={inputType}
                    />
                </div>
            );
        },
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
        text('employee_code', 'Code', (e) => e.employee_code),
        text('name', 'Name', (e) => e.name),
        text('position', 'Designation', (e) => e.position),
        text('daily_rate', 'Daily Rate', (e) => e.daily_rate, 'number', true, false, true),
        text('base_salary', 'Monthly Salary', (e) => e.base_salary, 'number', true, false, true),
        {
            accessorKey: 'pending_advancement_payout',
            header: ({ column }) => <SortHeader label="Adv Payout Queue (+)" column={column} />,
            cell: ({ row }) => {
                const val = parseFloat(String(row.original.pending_advancement_payout ?? 0));
                if (!val || val <= 0) {
                    return <div className="text-muted-foreground/40 font-mono">—</div>;
                }
                return (
                    <div className="font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(val)}
                    </div>
                );
            },
        },
        {
            accessorKey: 'cash_advance_balance',
            header: ({ column }) => <SortHeader label="Advancement Loan" column={column} />,
            cell: ({ row }) => {
                const val = parseFloat(String(row.original.cash_advance_balance ?? 0));
                if (!val || val <= 0) {
                    return <div className="text-muted-foreground/40 font-mono">—</div>;
                }
                return (
                    <div className="font-semibold text-rose-600 dark:text-rose-400">
                        {formatCurrency(val, true)}
                    </div>
                );
            },
        },
        text('sss_loan', 'SSS Loan', (e) => e.sss_loan, 'number', true, true, false),
        text('pagibig_contribution', 'Pag-IBIG Contrib', (e) => e.pagibig_contribution, 'number', true, true, false),
        text('emergency_loan', 'Emergency Loan', (e) => e.emergency_loan, 'number', true, true, false),
        text('withholding_tax', 'Tax W/Held', (e) => e.withholding_tax, 'number', true, true, false),
        text('contact_number', 'Contact', (e) => e.contact_number),
        text('tin', 'TIN', (e) => e.tin),
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => <EmployeeActions employee={row.original} />,
        },
    ];
}

export const employeeColumns = createEmployeeColumns();
