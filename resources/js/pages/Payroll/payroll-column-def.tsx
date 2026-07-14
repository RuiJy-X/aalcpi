'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, Eye, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { PayrollType } from './payroll-types';
import { Link, router } from '@inertiajs/react';
import {
    destroy as payrollDestroy,
    show as payrollShow,
} from '@/routes/payroll';
import {
    EditableSelectCell,
    type CellChangeHandler,
} from '@/components/data-table/editable-cells';

export type PayrollColumnsOptions = {
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

export function createPayrollColumns(
    options: PayrollColumnsOptions = {},
): ColumnDef<PayrollType>[] {
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
            accessorKey: 'employee_name',
            header: ({ column }) => (
                <SortHeader label="Employee" column={column} />
            ),
            cell: ({ row }) => (
                <div className="font-medium">{row.original.employee_name}</div>
            ),
        },
        {
            accessorKey: 'period_start',
            header: ({ column }) => (
                <SortHeader label="Period Start" column={column} />
            ),
            cell: ({ row }) => (
                <div>
                    {new Date(row.original.period_start).toLocaleDateString()}
                </div>
            ),
            meta: { isDateFilter: true },
        },
        {
            accessorKey: 'period_end',
            header: ({ column }) => (
                <SortHeader label="Period End" column={column} />
            ),
            cell: ({ row }) => (
                <div>
                    {new Date(row.original.period_end).toLocaleDateString()}
                </div>
            ),
            meta: { isDateFilter: true },
        },
        {
            accessorFn: (row) => `${row.days_worked} / ${row.total_days}`,
            id: 'attendance_days',
            header: ({ column }) => (
                <SortHeader label="Attendance (Days)" column={column} />
            ),
            cell: ({ row }) => (
                <div className="text-center">
                    {row.original.days_worked ?? 'NA'} /{' '}
                    {row.original.total_days ?? 'NA'}
                </div>
            ),
        },
        {
            accessorFn: (row) => `${row.hours_worked} / ${row.total_hours}`,
            id: 'attendance_hours',
            header: ({ column }) => (
                <SortHeader label="Attendance (Hours)" column={column} />
            ),
            cell: ({ row }) => (
                <div className="text-center">
                    {row.original.hours_worked ?? 'NA'} /{' '}
                    {row.original.total_hours ?? 'NA'}
                </div>
            ),
        },
        {
            accessorKey: 'basic_pay',
            header: ({ column }) => (
                <SortHeader label="Basic Pay" column={column} />
            ),
            cell: ({ row }) => (
                <div className="text-right">
                    ₱{Number(row.original.basic_pay).toFixed(2)}
                </div>
            ),
        },
        {
            accessorKey: 'holidays',
            header: ({ column }) => (
                <SortHeader label="Holidays" column={column} />
            ),
            cell: ({ row }) => (
                <div className="text-center">{row.original.holidays}</div>
            ),
        },
        {
            accessorKey: 'gross_pay',
            header: ({ column }) => (
                <SortHeader label="Gross Pay" column={column} />
            ),
            cell: ({ row }) => (
                <div className="text-right">
                    ₱{Number(row.original.gross_pay).toFixed(2)}
                </div>
            ),
        },
        {
            accessorKey: 'deductions',
            header: 'Deductions',
            cell: ({ row }) => (
                <div className="text-right">
                    ₱{Number(row.original.deductions).toFixed(2)}
                </div>
            ),
        },
        {
            accessorKey: 'net_pay',
            header: 'Net Pay',
            cell: ({ row }) => (
                <div className="text-right">
                    ₱{Number(row.original.net_pay).toFixed(2)}
                </div>
            ),
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => {
                const status = row.original.status;
                const statusClass =
                    status === 'draft'
                        ? 'bg-yellow-100 text-yellow-800'
                        : status === 'pending'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800';

                return (
                    <EditableSelectCell
                        rowId={row.original.id}
                        field="status"
                        isEditing={isEditing}
                        value={status}
                        display={
                            <span
                                className={`rounded-full px-3 py-1 text-sm font-medium ${statusClass}`}
                            >
                                {status}
                            </span>
                        }
                        options={[
                            { label: 'Draft', value: 'draft' },
                            { label: 'Pending', value: 'pending' },
                            { label: 'Paid', value: 'paid' },
                        ]}
                        onCellChange={onCellChange}
                    />
                );
            },
            filterFn: (row, columnId, filterValue) => {
                const rowValue = row.getValue(columnId);
                if (!filterValue) {
                    return true;
                }
                if (Array.isArray(filterValue)) {
                    return filterValue
                        .map((value) => String(value))
                        .includes(String(rowValue));
                }
                return String(rowValue) === String(filterValue);
            },
            meta: {
                label: 'Status',
                filterOptions: [
                    { label: 'All', value: '' },
                    { label: 'Draft', value: 'draft' },
                    { label: 'Pending', value: 'pending' },
                    { label: 'Paid', value: 'paid' },
                ],
            },
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => (
                <div
                    className="flex items-center gap-2"
                    data-no-row-open="true"
                >
                    <Button size="sm" variant="outline" asChild>
                        <Link href={payrollShow(row.original.id).url}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                        </Link>
                    </Button>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => {
                            const confirmed = window.confirm(
                                'Delete this payroll record? This action cannot be undone.',
                            );
                            if (!confirmed) {
                                return;
                            }
                            router.delete(payrollDestroy(row.original.id).url, {
                                preserveScroll: true,
                            });
                        }}
                        aria-label="Delete payroll"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ];
}

export const payrollColumns = createPayrollColumns();
