'use client';

import { ColumnDef } from '@tanstack/react-table';
import { UserRow } from '@/components/types/usertypes';
import { Checkbox } from '../ui/checkbox';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ArrowUpDown } from 'lucide-react';
import {
    EditableTextCell,
    type CellChangeHandler,
} from './editable-cells';

export type UsersColumnsOptions = {
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

export function createUsersColumns(
    options: UsersColumnsOptions = {},
): ColumnDef<UserRow>[] {
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
            accessorKey: 'email',
            header: ({ column }) => (
                <SortHeader label="Email" column={column} />
            ),
            cell: ({ row }) => (
                <EditableTextCell
                    rowId={row.original.id}
                    field="email"
                    isEditing={isEditing}
                    value={row.original.email}
                    display={row.original.email ?? '-'}
                    onCellChange={onCellChange}
                />
            ),
        },
        {
            accessorKey: 'username',
            header: 'Username',
            cell: ({ row }) => (
                <EditableTextCell
                    rowId={row.original.id}
                    field="username"
                    isEditing={isEditing}
                    value={row.original.username}
                    display={row.original.username ?? '-'}
                    onCellChange={onCellChange}
                />
            ),
        },
        {
            id: 'roles',
            accessorFn: (row) => (row.roles ?? []).join(', '),
            header: ({ column }) => (
                <SortHeader label="Roles" column={column} />
            ),
            cell: ({ row }) => {
                const roles = row.original.roles ?? [];
                if (roles.length === 0) {
                    return (
                        <span className="ml-2 text-muted-foreground">—</span>
                    );
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
}

export const usersColumns = createUsersColumns();
