'use client';

import { ColumnDef } from '@tanstack/react-table';
import { UserRow } from '@/components/types/usertypes';
import { Checkbox } from '../ui/checkbox';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
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
        accessorKey: 'username',
        header: 'Username',
        cell: ({ row }) => (
            <div className="ml-2 truncate">{row.original.username ?? '-'}</div>
        ),
    },
    {
        id: 'roles',
        accessorFn: (row) => (row.roles ?? []).join(', '),
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() =>
                    column.toggleSorting(column.getIsSorted() === 'asc')
                }
            >
                Roles
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => {
            const roles = row.original.roles ?? [];
            if (roles.length === 0) {
                return <span className="ml-2 text-muted-foreground">—</span>;
            }

            return (
                <div className="flex flex-wrap gap-1">
                    {roles.map((role) => (
                        <Badge key={role} variant="secondary">
                            {role}
                        </Badge>
                    ))}
                </div>
            );
        },
    },
];
