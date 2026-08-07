'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, Eye, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
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

function formatCurrency(
    val?: string | number | null,
    isDeduction: boolean = false,
) {
    if (val === null || val === undefined || val === '')
        return isDeduction ? '-₱0.00' : '₱0.00';
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num)) return isDeduction ? '-₱0.00' : '₱0.00';
    const formatted = new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
    }).format(num);
    return isDeduction && num > 0 ? `-${formatted}` : formatted;
}

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
            size="sm"
            className="-ml-3 h-8 data-[state=open]:bg-accent"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
            <span>{label}</span>
            <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
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
            accessorKey: 'employee_code',
            header: ({ column }) => <SortHeader label="Code" column={column} />,
            cell: ({ row }) => (
                <div className="font-mono text-xs font-semibold">
                    {row.original.employee_code ||
                        `EMP-${String(row.original.employee_id).padStart(3, '0')}`}
                </div>
            ),
        },
        {
            accessorKey: 'employee_name',
            header: ({ column }) => (
                <SortHeader label="Employee Name" column={column} />
            ),
            cell: ({ row }) => (
                <div className="font-bold text-foreground">
                    {row.original.employee_name}
                </div>
            ),
        },
        {
            accessorKey: 'position',
            header: ({ column }) => (
                <SortHeader label="Designation" column={column} />
            ),
            cell: ({ row }) => (
                <div className="text-xs text-muted-foreground">
                    {row.original.position || 'Encoder'}
                </div>
            ),
        },
        {
            accessorKey: 'daily_rate',
            header: ({ column }) => (
                <div className="text-right">
                    <SortHeader label="Daily Rate" column={column} />
                </div>
            ),
            cell: ({ row }) => (
                <div className="text-right font-semibold text-emerald-700 dark:text-emerald-400">
                    {formatCurrency(row.original.daily_rate)}
                </div>
            ),
        },
        {
            accessorKey: 'days_worked',
            header: ({ column }) => (
                <div className="text-center">
                    <SortHeader label="Days Worked" column={column} />
                </div>
            ),
            cell: ({ row }) => (
                <div className="text-center">
                    <Badge variant="outline" className="font-mono text-xs">
                        {row.original.days_worked ?? 0} days
                    </Badge>
                </div>
            ),
        },
        {
            accessorKey: 'gross_pay',
            header: ({ column }) => (
                <div className="text-right">
                    <SortHeader label="Gross Earnings" column={column} />
                </div>
            ),
            cell: ({ row }) => (
                <div className="text-right font-bold text-foreground">
                    {formatCurrency(row.original.gross_pay)}
                </div>
            ),
        },
        {
            accessorKey: 'sss_loan',
            header: ({ column }) => (
                <div className="text-right">
                    <SortHeader label="SSS Loan" column={column} />
                </div>
            ),
            cell: ({ row }) => (
                <div className="text-right font-medium text-rose-600 dark:text-rose-400">
                    {formatCurrency(row.original.sss_loan, true)}
                </div>
            ),
        },
        {
            accessorKey: 'pagibig_loan',
            header: ({ column }) => (
                <div className="text-right">
                    <SortHeader label="Pag-IBIG Loan" column={column} />
                </div>
            ),
            cell: ({ row }) => (
                <div className="text-right font-medium text-rose-600 dark:text-rose-400">
                    {formatCurrency(row.original.pagibig_loan, true)}
                </div>
            ),
        },
        {
            accessorKey: 'emergency_loan',
            header: ({ column }) => (
                <div className="text-right">
                    <SortHeader label="Emergency Loan" column={column} />
                </div>
            ),
            cell: ({ row }) => (
                <div className="text-right font-medium text-rose-600 dark:text-rose-400">
                    {formatCurrency(row.original.emergency_loan, true)}
                </div>
            ),
        },
        {
            accessorKey: 'deductions',
            header: ({ column }) => (
                <div className="text-right">
                    <SortHeader label="Total Deductions" column={column} />
                </div>
            ),
            cell: ({ row }) => (
                <div className="text-right font-bold text-rose-600 dark:text-rose-400">
                    {formatCurrency(row.original.deductions, true)}
                </div>
            ),
        },
        {
            accessorKey: 'net_pay',
            header: ({ column }) => (
                <div className="text-right">
                    <SortHeader label="Net Pay" column={column} />
                </div>
            ),
            cell: ({ row }) => (
                <div className="text-right text-sm font-extrabold text-emerald-700 dark:text-emerald-300">
                    {formatCurrency(row.original.net_pay)}
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
                        ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                        : status === 'pending'
                          ? 'bg-blue-100 text-blue-800 border-blue-200'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-200';

                return (
                    <EditableSelectCell
                        rowId={row.original.id}
                        field="status"
                        isEditing={isEditing}
                        value={status}
                        display={
                            <span
                                className={`rounded-full border px-2.5 py-0.5 text-xs font-bold tracking-wider uppercase ${statusClass}`}
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
                    className="flex items-center justify-end gap-1.5"
                    data-no-row-open="true"
                >
                    <Button size="xs" variant="outline" asChild>
                        <Link href={payrollShow(row.original.id).url}>
                            <Eye className="mr-1 h-3 w-3" />
                            View
                        </Link>
                    </Button>
                    <Button
                        size="xs"
                        variant="ghost"
                        className="text-rose-600 hover:text-rose-700"
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
                        <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                </div>
            ),
        },
    ];
}

export const payrollColumns = createPayrollColumns();
