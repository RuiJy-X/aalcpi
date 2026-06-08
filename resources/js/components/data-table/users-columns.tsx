'use client';

import { ColumnDef } from '@tanstack/react-table';
import { UserRow } from '@/components/types/usertypes';
import { Checkbox } from '../ui/checkbox';
import { Button } from '../ui/button';
import { ArrowUpDown } from 'lucide-react';

export const usersColumns: ColumnDef<UserRow>[] = [
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
        accessorKey: 'name',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === 'asc')
                }
            >
                Name
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => {
            const user = row.original;
            return (
                <div className="flex items-center">
                    <div className="ml-2 truncate">{user.name ?? '-'}</div>
                </div>
            );
        },
    },
    {
        accessorKey: 'email',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === 'asc')
                }
            >
                Email
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => {
            const user = row.original;
            return (
                <div className="flex items-center">
                    <div className="ml-2 truncate">{user.email ?? '-'}</div>
                </div>
            );
        },
    },
    {
        accessorKey: 'password',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === 'asc')
                }
            >
                Password
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => {
            const user = row.original;
            return (
                <div className="flex items-center">
                    <div className="ml-2 truncate">{'••••••••'}</div>
                </div>
            );
        },
    },
    {
        accessorKey: 'role',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === 'asc')
                }
            >
                Role
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => {
            const user = row.original;
            return (
                <div className="flex items-center">
                    <div className="ml-2 truncate">{user.role ?? '-'}</div>
                </div>
            );
        },
    },
];
