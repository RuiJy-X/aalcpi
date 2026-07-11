import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import {
    Container,
    ContainerHeader,
    ContainerHeaderEnd,
} from '@/components/container';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Field } from '@/components/ui/field';
import { Badge } from '@/components/ui/badge';
import { PermissionChecklist } from '@/components/permissions/permission-checklist';
import type { PermissionItem } from '@/components/types/usertypes';
import { useCan } from '@/hooks/use-can';
import { useState } from 'react';
import {
    index as rolesIndex,
    show as rolesShow,
    update as rolesUpdate,
} from '@/routes/roles';

type RoleDetail = {
    id: number;
    name: string;
    permissions: string[];
    is_super_admin: boolean;
};

type Props = {
    role: RoleDetail;
    permissionGroups: Record<string, PermissionItem[]>;
    resourceLabels: Record<string, string>;
};

export default function Show({
    role,
    permissionGroups,
    resourceLabels,
}: Props) {
    const { can } = useCan();
    const [isEditing, setIsEditing] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Role Management', href: rolesIndex().url },
        { title: role.name, href: rolesShow(role.id).url },
    ];

    const { data, setData, patch, processing, errors, reset } = useForm({
        name: role.name,
        permissions: role.permissions ?? [],
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(rolesUpdate(role.id).url, {
            onSuccess: () => setIsEditing(false),
        });
    };

    const canEdit = can('roles.update') && !role.is_super_admin;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Role: ${role.name}`} />

            <Container>
                <ContainerHeader>
                    <h1 className="text-2xl font-semibold">
                        Role: {role.name}
                        {role.is_super_admin && (
                            <Badge className="ml-2">full access</Badge>
                        )}
                    </h1>
                    <ContainerHeaderEnd>
                        {canEdit && isEditing && (
                            <Button
                                type="submit"
                                form="role-edit-form"
                                disabled={processing}
                                variant="blue"
                            >
                                {processing ? 'Saving...' : 'Save'}
                            </Button>
                        )}
                        {canEdit && (
                            <Button
                                type="button"
                                variant={isEditing ? 'destructive' : 'blue'}
                                onClick={() => {
                                    if (!isEditing) {
                                        setIsEditing(true);
                                    } else {
                                        setIsEditing(false);
                                        reset();
                                    }
                                }}
                            >
                                {isEditing ? 'Cancel' : 'Edit'}
                            </Button>
                        )}
                    </ContainerHeaderEnd>
                </ContainerHeader>

                {role.is_super_admin && (
                    <p className="mb-4 text-sm text-muted-foreground">
                        The super admin role always has full access to every
                        permission and cannot be modified.
                    </p>
                )}

                {isEditing && canEdit ? (
                    <form
                        id="role-edit-form"
                        onSubmit={handleSubmit}
                        className="space-y-4"
                    >
                        <Field className="max-w-md">
                            <Label>Role name</Label>
                            <Input
                                value={data.name}
                                onChange={(e) =>
                                    setData('name', e.target.value)
                                }
                            />
                            {errors.name && (
                                <p className="mt-1 text-sm text-red-500">
                                    {errors.name}
                                </p>
                            )}
                        </Field>

                        <div>
                            <Label className="mb-2 block">Permissions</Label>
                            <PermissionChecklist
                                permissionGroups={permissionGroups}
                                resourceLabels={resourceLabels}
                                selected={data.permissions}
                                onChange={(permissions) =>
                                    setData('permissions', permissions)
                                }
                            />
                        </div>
                    </form>
                ) : (
                    <div className="space-y-4">
                        <div>
                            <span className="font-semibold">Name: </span>
                            {role.name}
                        </div>
                        <div>
                            <div className="mb-2 font-semibold">
                                Permissions
                            </div>
                            <PermissionChecklist
                                permissionGroups={permissionGroups}
                                resourceLabels={resourceLabels}
                                selected={role.permissions}
                                onChange={() => {}}
                                disabled
                            />
                        </div>
                    </div>
                )}
            </Container>
        </AppLayout>
    );
}
