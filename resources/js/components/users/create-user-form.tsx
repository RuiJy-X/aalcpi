import React from 'react';
import { useForm } from '@inertiajs/react';
import { Input } from '../ui/input';
import { Field } from '../ui/field';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';
import { store as userStore } from '@/routes/users';
import { PermissionChecklist } from '@/components/permissions/permission-checklist';
import type { PermissionItem, RoleOption } from '@/components/types/usertypes';
import { useCan } from '@/hooks/use-can';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    roles: RoleOption[];
    permissionGroups: Record<string, PermissionItem[]>;
    resourceLabels: Record<string, string>;
};

const CreateUserForm = ({
    open,
    onOpenChange,
    roles,
    permissionGroups,
    resourceLabels,
}: Props) => {
    const { isSuperAdmin } = useCan();
    const { data, setData, errors, processing, reset, post, clearErrors } =
        useForm({
            name: '',
            email: '',
            username: '',
            password: '',
            roles: [] as string[],
            permissions: [] as string[],
        });

    const handleOpenChange = (nextOpen: boolean) => {
        if (!nextOpen) {
            reset();
            clearErrors();
        }
        onOpenChange(nextOpen);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(userStore().url, {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onOpenChange(false);
            },
        });
    };

    const toggleRole = (roleName: string, checked: boolean) => {
        if (checked) {
            setData('roles', [...new Set([...data.roles, roleName])]);
        } else {
            setData(
                'roles',
                data.roles.filter((r) => r !== roleName),
            );
        }
    };

    const availableRoles = roles.filter(
        (role) => role.name !== 'super_admin' || isSuperAdmin,
    );

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
                <DialogHeader className="shrink-0 border-b px-6 py-4">
                    <DialogTitle>Create a new user</DialogTitle>
                    <DialogDescription>
                        Set account details, roles, and optional direct
                        permissions.
                    </DialogDescription>
                </DialogHeader>

                <form
                    id="create-user-form"
                    onSubmit={handleSubmit}
                    className="flex min-h-0 flex-1 flex-col"
                >
                    <div className="space-y-5 overflow-y-auto px-6 py-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <Field>
                                <Label>Name</Label>
                                <Input
                                    type="text"
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

                            <Field>
                                <Label>Username</Label>
                                <Input
                                    type="text"
                                    value={data.username}
                                    onChange={(e) =>
                                        setData('username', e.target.value)
                                    }
                                />
                                {errors.username && (
                                    <p className="mt-1 text-sm text-red-500">
                                        {errors.username}
                                    </p>
                                )}
                            </Field>

                            <Field>
                                <Label>Email</Label>
                                <Input
                                    type="email"
                                    value={data.email}
                                    onChange={(e) =>
                                        setData('email', e.target.value)
                                    }
                                />
                                {errors.email && (
                                    <p className="mt-1 text-sm text-red-500">
                                        {errors.email}
                                    </p>
                                )}
                            </Field>

                            <Field>
                                <Label>Password</Label>
                                <Input
                                    type="password"
                                    value={data.password}
                                    onChange={(e) =>
                                        setData('password', e.target.value)
                                    }
                                />
                                {errors.password && (
                                    <p className="mt-1 text-sm text-red-500">
                                        {errors.password}
                                    </p>
                                )}
                            </Field>
                        </div>

                        <Field>
                            <Label className="mb-2 block">Roles</Label>
                            <div className="flex flex-wrap gap-4">
                                {availableRoles.map((role) => (
                                    <div
                                        key={role.id}
                                        className="flex items-center gap-2"
                                    >
                                        <Checkbox
                                            id={`create-role-${role.name}`}
                                            checked={data.roles.includes(
                                                role.name,
                                            )}
                                            onCheckedChange={(value) =>
                                                toggleRole(role.name, !!value)
                                            }
                                        />
                                        <Label
                                            htmlFor={`create-role-${role.name}`}
                                            className="font-normal"
                                        >
                                            {role.name}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                            {errors.roles && (
                                <p className="mt-1 text-sm text-red-500">
                                    {errors.roles}
                                </p>
                            )}
                        </Field>

                        <Field>
                            <Label className="mb-2 block">
                                Direct permissions (optional)
                            </Label>
                            <p className="mb-3 text-sm text-muted-foreground">
                                Assign extra permissions beyond what roles
                                grant.
                            </p>
                            <PermissionChecklist
                                permissionGroups={permissionGroups}
                                resourceLabels={resourceLabels}
                                selected={data.permissions}
                                onChange={(permissions) =>
                                    setData('permissions', permissions)
                                }
                            />
                            {errors.permissions && (
                                <p className="mt-1 text-sm text-red-500">
                                    {errors.permissions}
                                </p>
                            )}
                        </Field>
                    </div>

                    <DialogFooter className="shrink-0 border-t px-6 py-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleOpenChange(false)}
                            disabled={processing}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Creating...' : 'Create User'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default CreateUserForm;
