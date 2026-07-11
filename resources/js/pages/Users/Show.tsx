import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { index as userIndex } from '@/routes/users';
import { update as userUpdate } from '@/routes/users';
import { show as userShow } from '@/routes/users';
import type { BreadcrumbItem } from '@/types';
import {
    Container,
    ContainerHeader,
    ContainerHeaderEnd,
} from '@/components/container';
import type {
    PermissionItem,
    RoleOption,
    UserRow,
} from '@/components/types/usertypes';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { EyeOff, Eye } from 'lucide-react';
import { PermissionChecklist } from '@/components/permissions/permission-checklist';
import { useCan } from '@/hooks/use-can';

type Props = {
    user: UserRow;
    roles: RoleOption[];
    permissionGroups: Record<string, PermissionItem[]>;
    resourceLabels: Record<string, string>;
};

export default function Show({
    user,
    roles,
    permissionGroups,
    resourceLabels,
}: Props) {
    const { can, isSuperAdmin } = useCan();
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'User Management',
            href: userIndex().url,
        },
        {
            title: 'User Details',
            href: userShow(user.id).url,
        },
        {
            title: user.name,
            href: userShow(user.id).url,
        },
    ];

    const [isEditing, setIsEditing] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, patch, processing, errors, reset } = useForm({
        name: user.name || '',
        email: user.email || '',
        username: user.username || '',
        password: '',
        roles: user.roles ?? [],
        permissions: user.permissions ?? [],
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(userUpdate(user.id).url, {
            onSuccess: () => {
                setIsEditing(false);
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
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Users"></Head>

            <Container>
                <ContainerHeader>
                    <h1 className="text-2xl font-semibold">User Information</h1>
                    <ContainerHeaderEnd>
                        {can('users.update') && isEditing && (
                            <Button
                                type="submit"
                                form="user-edit-form"
                                disabled={processing}
                                variant="blue"
                            >
                                {processing ? 'Saving...' : 'Done'}
                            </Button>
                        )}

                        {can('users.update') && (
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
                {isEditing ? (
                    <form
                        id="user-edit-form"
                        onSubmit={handleSubmit}
                        className="space-y-6"
                    >
                        <table className="table-auto border border-gray-400 *:border-collapse">
                            <tbody>
                                <tr>
                                    <td className="h-8 border border-gray-400 bg-secondary pr-5 font-semibold">
                                        Name:
                                    </td>
                                    <td className="h-8 w-full border border-gray-400 px-2 py-2">
                                        <Input
                                            type="text"
                                            value={data.name}
                                            onChange={(e) =>
                                                setData('name', e.target.value)
                                            }
                                        />
                                        {errors.name && (
                                            <p className="text-sm text-red-600">
                                                {errors.name}
                                            </p>
                                        )}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="h-8 border border-gray-400 bg-secondary pr-5 font-semibold">
                                        Email:
                                    </td>
                                    <td className="h-8 w-full border border-gray-400 px-2 py-2">
                                        <Input
                                            type="email"
                                            value={data.email}
                                            onChange={(e) =>
                                                setData('email', e.target.value)
                                            }
                                        />
                                        {errors.email && (
                                            <p className="text-sm text-red-600">
                                                {errors.email}
                                            </p>
                                        )}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="h-8 border border-gray-400 bg-secondary pr-5 font-semibold">
                                        Username:
                                    </td>
                                    <td className="h-8 w-full border border-gray-400 px-2 py-2">
                                        <Input
                                            type="text"
                                            value={data.username}
                                            onChange={(e) =>
                                                setData(
                                                    'username',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        {errors.username && (
                                            <p className="text-sm text-red-600">
                                                {errors.username}
                                            </p>
                                        )}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="h-8 border border-gray-400 bg-secondary pr-5 font-semibold">
                                        Password:
                                    </td>
                                    <td className="h-8 border border-gray-400 px-2 py-2">
                                        <div className="relative flex items-center">
                                            <Input
                                                type={
                                                    showPassword
                                                        ? 'text'
                                                        : 'password'
                                                }
                                                value={data.password}
                                                onChange={(e) =>
                                                    setData(
                                                        'password',
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Leave blank to keep current password"
                                                className="w-full pr-10"
                                            />
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setShowPassword(
                                                        !showPassword,
                                                    )
                                                }
                                                className="absolute right-3 text-gray-500 hover:text-gray-700"
                                            >
                                                {showPassword ? (
                                                    <EyeOff size={16} />
                                                ) : (
                                                    <Eye size={16} />
                                                )}
                                            </button>
                                        </div>
                                        {errors.password && (
                                            <p className="mt-1 text-sm text-red-600">
                                                {errors.password}
                                            </p>
                                        )}
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        <div>
                            <Label className="mb-2 block font-semibold">
                                Roles
                            </Label>
                            <div className="flex flex-wrap gap-4">
                                {availableRoles.map((role) => (
                                    <div
                                        key={role.id}
                                        className="flex items-center gap-2"
                                    >
                                        <Checkbox
                                            id={`edit-role-${role.name}`}
                                            checked={data.roles.includes(
                                                role.name,
                                            )}
                                            onCheckedChange={(value) =>
                                                toggleRole(role.name, !!value)
                                            }
                                        />
                                        <Label
                                            htmlFor={`edit-role-${role.name}`}
                                            className="font-normal"
                                        >
                                            {role.name}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                            {errors.roles && (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.roles}
                                </p>
                            )}
                        </div>

                        <div>
                            <Label className="mb-2 block font-semibold">
                                Direct permissions
                            </Label>
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
                    <div className="space-y-6">
                        <table className="table-auto border border-gray-400 *:border-collapse">
                            <tbody>
                                <tr>
                                    <td className="h-8 border border-gray-400 bg-secondary pr-5 font-semibold">
                                        Name:
                                    </td>
                                    <td className="h-8 w-full border border-gray-400 bg-secondary px-2">
                                        {user.name}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="h-8 border border-gray-400 bg-secondary pr-5 font-semibold">
                                        Email:
                                    </td>
                                    <td className="h-8 w-full border border-gray-400 bg-secondary px-2">
                                        {user.email}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="h-8 border border-gray-400 bg-secondary pr-5 font-semibold">
                                        Username:
                                    </td>
                                    <td className="h-8 w-full border border-gray-400 bg-secondary px-2">
                                        {user.username}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="h-8 border border-gray-400 bg-secondary pr-5 font-semibold">
                                        Password:
                                    </td>
                                    <td className="h-8 border border-gray-400 bg-secondary px-2 text-gray-500 italic">
                                        •••••••• (Encrypted on Server)
                                    </td>
                                </tr>
                                <tr>
                                    <td className="h-8 border border-gray-400 bg-secondary pr-5 font-semibold">
                                        Roles:
                                    </td>
                                    <td className="h-8 w-full border border-gray-400 bg-secondary px-2 py-1">
                                        <div className="flex flex-wrap gap-1">
                                            {(user.roles ?? []).length === 0
                                                ? '—'
                                                : (user.roles ?? []).map(
                                                      (role) => (
                                                          <Badge
                                                              key={role}
                                                              variant="secondary"
                                                          >
                                                              {role}
                                                          </Badge>
                                                      ),
                                                  )}
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>

                        <div>
                            <h2 className="mb-2 font-semibold">
                                Effective permissions
                            </h2>
                            <div className="flex flex-wrap gap-1">
                                {(user.all_permissions ?? []).length === 0 ? (
                                    <span className="text-sm text-muted-foreground">
                                        No permissions
                                    </span>
                                ) : (
                                    (user.all_permissions ?? []).map((p) => (
                                        <Badge key={p} variant="outline">
                                            {p}
                                        </Badge>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </Container>
        </AppLayout>
    );
}
