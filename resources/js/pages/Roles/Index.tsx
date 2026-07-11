import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import {
    Container,
    ContainerHeader,
    ContainerHeaderEnd,
} from '@/components/container';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { PermissionItem } from '@/components/types/usertypes';
import { useCan } from '@/hooks/use-can';
import CreateRoleDialog from '@/components/roles/create-role-dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    index as rolesIndex,
    show as rolesShow,
    destroy as rolesDestroy,
} from '@/routes/roles';

type RoleRow = {
    id: number;
    name: string;
    users_count: number;
    permissions: string[];
    is_super_admin: boolean;
};

type Props = {
    roles: RoleRow[];
    permissionGroups: Record<string, PermissionItem[]>;
    resourceLabels: Record<string, string>;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Role Management',
        href: rolesIndex().url,
    },
];

export default function Index({
    roles,
    permissionGroups,
    resourceLabels,
}: Props) {
    const { can } = useCan();
    const [createOpen, setCreateOpen] = useState(false);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Roles" />

            <Container>
                <ContainerHeader>
                    Roles
                    <ContainerHeaderEnd>
                        {can('roles.create') && (
                            <Button onClick={() => setCreateOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                Create new role
                            </Button>
                        )}
                    </ContainerHeaderEnd>
                </ContainerHeader>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Users</TableHead>
                            <TableHead>Permissions</TableHead>
                            <TableHead className="text-right">
                                Actions
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {roles.map((role) => (
                            <TableRow
                                key={role.id}
                                className="cursor-pointer"
                                onDoubleClick={() =>
                                    router.visit(rolesShow(role.id).url)
                                }
                            >
                                <TableCell className="font-medium">
                                    {role.name}
                                    {role.is_super_admin && (
                                        <Badge
                                            className="ml-2"
                                            variant="default"
                                        >
                                            full access
                                        </Badge>
                                    )}
                                </TableCell>
                                <TableCell>{role.users_count}</TableCell>
                                <TableCell>
                                    <span className="text-sm text-muted-foreground">
                                        {role.permissions.length} permission
                                        {role.permissions.length === 1
                                            ? ''
                                            : 's'}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                router.visit(
                                                    rolesShow(role.id).url,
                                                )
                                            }
                                        >
                                            View
                                        </Button>
                                        {can('roles.delete') &&
                                            !role.is_super_admin && (
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => {
                                                        if (
                                                            confirm(
                                                                `Delete role "${role.name}"?`,
                                                            )
                                                        ) {
                                                            router.delete(
                                                                rolesDestroy(
                                                                    role.id,
                                                                ).url,
                                                            );
                                                        }
                                                    }}
                                                >
                                                    Delete
                                                </Button>
                                            )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Container>

            {can('roles.create') && (
                <CreateRoleDialog
                    open={createOpen}
                    onOpenChange={setCreateOpen}
                    permissionGroups={permissionGroups}
                    resourceLabels={resourceLabels}
                />
            )}
        </AppLayout>
    );
}
