'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '../ui/checkbox';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ArrowUpDown, Eye, Trash2, Shield, Sparkles } from 'lucide-react';
import { router } from '@inertiajs/react';
import { show as rolesShow, destroy as rolesDestroy } from '@/routes/roles';

export type RoleRow = {
    id: number;
    name: string;
    users_count: number;
    permissions: string[];
    is_super_admin: boolean;
};

export type RolesColumnsOptions = {
    canDelete?: boolean;
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
            className="h-8 px-2 hover:bg-accent/50"
        >
            {label}
            <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
        </Button>
    );
}

export function createRolesColumns(
    options: RolesColumnsOptions = {},
): ColumnDef<RoleRow>[] {
    const { canDelete = false } = options;

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
                <SortHeader label="Role Name" column={column} />
            ),
            cell: ({ row }) => {
                const role = row.original;
                return (
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">
                            {role.name}
                        </span>
                        {role.is_super_admin && (
                            <Badge
                                variant="secondary"
                                className="border border-emerald-200 bg-[#E7F0E5] text-[#1F4B32] dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
                            >
                                <Sparkles className="mr-1 h-3 w-3 text-emerald-600" />
                                Full Access
                            </Badge>
                        )}
                    </div>
                );
            },
        },
        {
            accessorKey: 'users_count',
            header: ({ column }) => (
                <SortHeader label="Assigned Users" column={column} />
            ),
            cell: ({ row }) => {
                const count = row.original.users_count;
                return (
                    <Badge variant="outline" className="font-medium">
                        {count} {count === 1 ? 'user' : 'users'}
                    </Badge>
                );
            },
        },
        {
            id: 'permissions',
            accessorFn: (row) =>
                row.is_super_admin ? 999 : row.permissions.length,
            header: ({ column }) => (
                <SortHeader label="Permissions" column={column} />
            ),
            cell: ({ row }) => {
                const role = row.original;
                if (role.is_super_admin) {
                    return (
                        <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                            All System Permissions
                        </span>
                    );
                }

                const count = role.permissions.length;
                return (
                    <span className="text-sm text-muted-foreground">
                        {count} {count === 1 ? 'permission' : 'permissions'}
                    </span>
                );
            },
        },
        {
            id: 'actions',
            header: () => <div className="text-right">Actions</div>,
            cell: ({ row }) => {
                const role = row.original;
                return (
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.visit(rolesShow(role.id).url)}
                            className="h-8 px-3"
                        >
                            <Eye className="mr-1.5 h-3.5 w-3.5" />
                            View
                        </Button>

                        {canDelete && !role.is_super_admin && (
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                    if (
                                        confirm(
                                            `Are you sure you want to delete role "${role.name}"?`,
                                        )
                                    ) {
                                        router.delete(rolesDestroy(role.id).url);
                                    }
                                }}
                                className="h-8 px-3"
                            >
                                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                                Delete
                            </Button>
                        )}
                    </div>
                );
            },
        },
    ];
}
