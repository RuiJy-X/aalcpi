import { useMemo, useState } from 'react';
import { Head } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { DataTable } from '@/components/data-table/data-table';
import AppLayout from '@/layouts/app-layout';
import {
    bulkUpdate as usersBulkUpdate,
    index as userIndex,
    show as userShow,
} from '@/routes/users';
import type { BreadcrumbItem } from '@/types';
import {
    Container,
    ContainerHeader,
    ContainerHeaderEnd,
} from '@/components/container';
import CreateUserForm from '@/components/users/create-user-form';
import { createUsersColumns } from '@/components/data-table/users-columns';
import type {
    PermissionItem,
    RoleOption,
    UserRow,
} from '@/components/types/usertypes';
import { userBulkDelete } from '@/components/data-table/bulk-delete';
import { TableEditToolbar } from '@/components/data-table/table-edit-toolbar';
import { useTableEditMode } from '@/hooks/use-table-edit-mode';
import { useCan } from '@/hooks/use-can';
import { Button } from '@/components/ui/button';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'User Management',
        href: userIndex().url,
    },
];

type Props = {
    users: UserRow[];
    roles: RoleOption[];
    permissionGroups: Record<string, PermissionItem[]>;
    resourceLabels: Record<string, string>;
};

export default function Index({
    users,
    roles,
    permissionGroups,
    resourceLabels,
}: Props) {
    const { can } = useCan();
    const [createOpen, setCreateOpen] = useState(false);

    const {
        isEditing,
        isSaving,
        startEditing,
        cancelEditing,
        saveEdits,
        handleCellChange,
    } = useTableEditMode({
        rows: users,
        fields: ['name', 'email', 'username'],
        saveUrl: usersBulkUpdate().url,
    });

    const usersColumns = useMemo(
        () =>
            createUsersColumns({
                isEditing,
                onCellChange: handleCellChange,
            }),
        [isEditing, handleCellChange],
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Users"></Head>

            <Container>
                <ContainerHeader>
                    Users
                    <ContainerHeaderEnd>
                        {can('users.update') && (
                            <TableEditToolbar
                                isEditing={isEditing}
                                isSaving={isSaving}
                                disabled={users.length === 0}
                                onStart={startEditing}
                                onCancel={cancelEditing}
                                onSave={saveEdits}
                            />
                        )}
                        {can('users.create') && (
                            <Button
                                onClick={() => setCreateOpen(true)}
                                disabled={isEditing}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Create new user
                            </Button>
                        )}
                    </ContainerHeaderEnd>
                </ContainerHeader>
                <DataTable
                    columns={usersColumns}
                    data={users}
                    onRowDoubleClick={
                        isEditing
                            ? undefined
                            : (user) => userShow(user.id).url
                    }
                    bulkDelete={
                        !isEditing && can('users.delete')
                            ? userBulkDelete
                            : undefined
                    }
                />
            </Container>

            {can('users.create') && (
                <CreateUserForm
                    open={createOpen}
                    onOpenChange={setCreateOpen}
                    roles={roles}
                    permissionGroups={permissionGroups}
                    resourceLabels={resourceLabels}
                />
            )}
        </AppLayout>
    );
}
