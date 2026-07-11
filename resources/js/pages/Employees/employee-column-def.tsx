//What data is shown for each column
'use client';

import type { ColumnDef } from '@tanstack/react-table';

import { ArrowUpDown, Contact } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { destroy as employeeDelete } from '@/routes/employees';

import type { EmployeeType } from './employeeTypes';
import EmployeeActions from '@/pages/Employees/employee-actions';

export const employeeColumns: ColumnDef<EmployeeType>[] = [
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
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    className="truncate"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === 'asc')
                    }
                >
                    Employee Code
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => {
            const employee = row.original;
            return (
                <div className="flex items-center">
                    <div className="ml-2 truncate">
                        {employee.employee_code ?? 'NA'}
                    </div>
                </div>
            );
        },
    },
    {
        accessorKey: 'name',
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === 'asc')
                    }
                >
                    Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => {
            const employee = row.original;
            return (
                <div className="flex items-center">
                    <div className="ml-2 truncate">{employee.name ?? 'NA'}</div>
                </div>
            );
        },
    },
    {
        accessorKey: 'position',
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === 'asc')
                    }
                >
                    Position
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => {
            const employee = row.original;
            return (
                <div className="flex items-center">
                    <div className="ml-2 truncate">
                        {employee.position ?? 'NA'}
                    </div>
                </div>
            );
        },
    },
    {
        accessorKey: 'department',
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === 'asc')
                    }
                >
                    Department
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => {
            const employee = row.original;
            return (
                <div className="flex items-center">
                    <div className="ml-2 truncate">
                        {employee.department ?? 'NA'}
                    </div>
                </div>
            );
        },
    },
    {
        accessorKey: 'employment_type',
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === 'asc')
                    }
                >
                    Employment Type
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => {
            const employee = row.original;
            return (
                <div className="flex items-center">
                    <div className="ml-2 truncate">
                        {employee.employment_type ?? 'NA'}
                    </div>
                </div>
            );
        },
    },
    {
        accessorKey: 'base_salary',
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === 'asc')
                    }
                >
                    Base Salary
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => {
            const employee = row.original;
            return (
                <div className="flex items-center">
                    <div className="ml-2 truncate">
                        {employee.base_salary ?? 'NA'}
                    </div>
                </div>
            );
        },
    },
    {
        accessorKey: 'hourly_rate',
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === 'asc')
                    }
                >
                    Hourly Rate
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => {
            const employee = row.original;
            return (
                <div className="flex items-center">
                    <div className="ml-2 truncate">
                        {employee.hourly_rate ?? 'NA'}
                    </div>
                </div>
            );
        },
    },
    {
        accessorKey: 'contact_number',
        header: ({ column }) => {
            return <div>Contact Number</div>;
        },
        cell: ({ row }) => {
            const employee = row.original;
            return (
                <div className="flex items-center">
                    <div className="ml-2 truncate">
                        {employee.contact_number ?? 'NA'}
                    </div>
                </div>
            );
        },
    },
    {
        accessorKey: 'address',
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === 'asc')
                    }
                >
                    Address
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => {
            const employee = row.original;
            return (
                <div className="flex items-center">
                    <div className="ml-2 truncate">
                        {employee.address ?? 'NA'}
                    </div>
                </div>
            );
        },
    },
    {
        accessorKey: 'tin',
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() =>
                        column.toggleSorting(column.getIsSorted() === 'asc')
                    }
                >
                    TIN
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => {
            const employee = row.original;
            return (
                <div className="flex items-center">
                    <div className="ml-2 truncate">{employee.tin ?? 'NA'}</div>
                </div>
            );
        },
    },

    {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
            const employee = row.original;
            return <EmployeeActions employee={employee} />;
        },
    },
];
