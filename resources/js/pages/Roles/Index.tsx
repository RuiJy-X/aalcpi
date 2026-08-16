import { useMemo, useState } from 'react';
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
import type { PermissionItem } from '@/components/types/usertypes';
import { useCan } from '@/hooks/use-can';
import CreateRoleDialog from '@/components/roles/create-role-dialog';
import { DataTable } from '@/components/data-table/data-table';
import {
    createRolesColumns,
    type RoleRow,
} from '@/components/data-table/roles-columns';
import {
    index as rolesIndex,
    show as rolesShow,
} from '@/routes/roles';

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

    const rolesColumns = useMemo(
        () =>
            createRolesColumns({
                canDelete: can('roles.delete'),
            }),
        [can],
    );

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

                <DataTable
                    columns={rolesColumns}
                    data={roles}
                    onRowDoubleClick={(role) =>
                        router.visit(rolesShow(role.id).url)
                    }
                />
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
