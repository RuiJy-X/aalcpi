'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, Pencil, Check, X, Eye, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import React from 'react';
import { PayrollType } from './payroll-types';
import { Link, router, useForm } from '@inertiajs/react';
import {
    destroy as payrollDestroy,
    show as payrollShow,
} from '@/routes/payroll';

interface EditingCell {
    rowId: string | number;
    field: string;
}

export const payrollColumns: ColumnDef<PayrollType>[] = [
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
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === 'asc')
                }
            >
                Employee
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => (
            <div className="font-medium">{row.original.employee_name}</div>
        ),
    },
    {
        accessorKey: 'period_start',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === 'asc')
                }
            >
                Period Start
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => (
            <div>
                {new Date(row.original.period_start).toLocaleDateString()}
            </div>
        ),
        meta: {
            isDateFilter: true,
        },
    },
    {
        accessorKey: 'period_end',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === 'asc')
                }
            >
                Period End
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => (
            <div>{new Date(row.original.period_end).toLocaleDateString()}</div>
        ),
        meta: {
            isDateFilter: true,
        },
    },

    {
        accessorFn: (row) => `${row.days_worked} / ${row.total_days}`,
        id: 'attendance_days',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === 'asc')
                }
            >
                Attendance (Days)
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
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
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === 'asc')
                }
            >
                Attendance (Hours)
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
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
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === 'asc')
                }
            >
                Basic Pay
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
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
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === 'asc')
                }
            >
                Holidays
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => (
            <div className="text-center">{row.original.holidays}</div>
        ),
    },
    {
        accessorKey: 'gross_pay',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === 'asc')
                }
            >
                Gross Pay
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
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
            <EditableCell
                payrollId={row.original.id}
                field="deductions"
                value={row.original.deductions}
            />
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
                <div className="flex justify-center">
                    <span
                        className={`rounded-full px-3 py-1 text-sm font-medium ${statusClass}`}
                    >
                        {status}
                    </span>
                </div>
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
            <div className="flex items-center gap-2" data-no-row-open="true">
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

const EditableCell = ({
    payrollId,
    field,
    value,
}: {
    payrollId: number;
    field: string;
    value: string | number;
}) => {
    const [isEditing, setIsEditing] = React.useState(false);
    const [editValue, setEditValue] = React.useState(String(value ?? 0));
    const { patch, processing, setData } = useForm({
        [field]: value,
    });

    const handleSave = () => {
        setData(field, editValue);

        patch(`/Payroll/${payrollId}`, {
            preserveScroll: true,
            onSuccess: () => {
                setIsEditing(false);
            },
        });
    };

    if (isEditing) {
        return (
            <div className="flex items-center gap-2" data-no-row-open="true">
                <Input
                    type="number"
                    step="0.01"
                    value={editValue}
                    onChange={(e) => {
                        setEditValue(e.target.value);
                        setData(field, e.target.value);
                    }}
                    className="w-24"
                    disabled={processing}
                />
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleSave}
                    disabled={processing}
                >
                    <Check className="h-4 w-4" />
                </Button>
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                        setIsEditing(false);
                        setEditValue(String(value ?? 0));
                    }}
                    disabled={processing}
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>
        );
    }

    return (
        <div
            className="group flex cursor-pointer items-center gap-2 rounded p-1 hover:bg-gray-100"
            onClick={() => setIsEditing(true)}
            data-no-row-open="true"
        >
            <span className="flex-1 text-right">
                ₱{Number(editValue).toFixed(2)}
            </span>
            <Pencil className="h-4 w-4 opacity-0 group-hover:opacity-100" />
        </div>
    );
};
