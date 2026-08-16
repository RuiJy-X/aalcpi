import { useState, useMemo } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
    index as userIndex,
    update as userUpdate,
    show as userShow,
} from '@/routes/users';
import type { BreadcrumbItem, SharedData } from '@/types';
import { Container } from '@/components/container';
import type {
    PermissionItem,
    RoleOption,
    UserRow,
} from '@/components/types/usertypes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { PermissionChecklist } from '@/components/permissions/permission-checklist';
import { useCan } from '@/hooks/use-can';
import { ChangePasswordModal } from '@/components/users/ChangePasswordModal';
import {
    User as UserIcon,
    Mail,
    AtSign,
    Shield,
    Key,
    Pencil,
    Check,
    Search,
    Sparkles,
    ShieldCheck,
    CheckCircle2,
    XCircle,
    KeyRound,
} from 'lucide-react';

type Props = {
    user: UserRow;
    roles: RoleOption[];
    permissionGroups: Record<string, PermissionItem[]>;
    resourceLabels: Record<string, string>;
};

function getInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Show({
    user,
    roles,
    permissionGroups,
    resourceLabels,
}: Props) {
    const { can, isSuperAdmin } = useCan();
    const { auth } = usePage<SharedData>().props;
    const isSelf = auth?.user?.id === user.id;

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
    const [permissionSearch, setPermissionSearch] = useState('');
    const [changePasswordOpen, setChangePasswordOpen] = useState(false);

    const { data, setData, patch, processing, errors, reset } = useForm({
        name: user.name || '',
        email: user.email || '',
        username: user.username || '',
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

    const effectivePermissions = useMemo(() => {
        return user.all_permissions ?? [];
    }, [user.all_permissions]);

    // Group effective permissions for structured display
    const groupedEffectivePermissions = useMemo(() => {
        const result: Record<string, string[]> = {};
        const searchLower = permissionSearch.trim().toLowerCase();

        Object.entries(permissionGroups).forEach(([groupKey, groupItems]) => {
            const groupLabel = resourceLabels[groupKey] || groupKey;
            const matching = groupItems
                .map((item) => item.name)
                .filter((permName) => {
                    const isGranted =
                        user.is_super_admin ||
                        effectivePermissions.includes(permName);
                    if (!isGranted) return false;
                    if (!searchLower) return true;
                    return (
                        permName.toLowerCase().includes(searchLower) ||
                        groupLabel.toLowerCase().includes(searchLower)
                    );
                });

            if (matching.length > 0) {
                result[groupLabel] = matching;
            }
        });

        return result;
    }, [
        permissionGroups,
        resourceLabels,
        effectivePermissions,
        user.is_super_admin,
        permissionSearch,
    ]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`User: ${user.name}`} />

            <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                {/* Profile Hero Header Card */}
                <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card p-6 shadow-sm transition-all sm:p-8">
                    <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-5">
                            {/* Avatar Chip */}
                            <Avatar className="h-16 w-16 rounded-2xl border border-emerald-200/60 bg-[#E7F0E5] shadow-xs dark:bg-emerald-950/40">
                                <AvatarFallback className="rounded-2xl text-xl font-bold tracking-tight text-[#1F4B32] dark:text-emerald-400">
                                    {getInitials(user.name)}
                                </AvatarFallback>
                            </Avatar>

                            <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2.5">
                                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                        {user.name}
                                    </h1>
                                    {user.is_super_admin && (
                                        <Badge
                                            variant="secondary"
                                            className="border border-emerald-200 bg-[#E7F0E5] text-[#1F4B32] dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
                                        >
                                            <Sparkles className="mr-1 h-3 w-3 text-emerald-600" />
                                            Super Admin
                                        </Badge>
                                    )}
                                    {isSelf && (
                                        <Badge
                                            variant="outline"
                                            className="border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300"
                                        >
                                            You (Current Session)
                                        </Badge>
                                    )}
                                </div>

                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1.5 font-medium text-foreground/80">
                                        <AtSign className="h-3.5 w-3.5 text-muted-foreground" />
                                        {user.username}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                                        {user.email}
                                    </span>
                                    <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground">
                                        ID: #{user.id}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 self-start sm:self-center">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setChangePasswordOpen(true)}
                                className="h-10 px-4 font-medium"
                            >
                                <KeyRound className="mr-2 h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                Change Password
                            </Button>

                            {can('users.update') && (
                                <>
                                    {isEditing ? (
                                        <>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => {
                                                    setIsEditing(false);
                                                    reset();
                                                }}
                                                className="h-10 px-4"
                                            >
                                                <XCircle className="mr-2 h-4 w-4" />
                                                Cancel
                                            </Button>
                                            <Button
                                                type="submit"
                                                form="user-edit-form"
                                                disabled={processing}
                                                variant="blue"
                                                className="h-10 px-5 font-semibold"
                                            >
                                                <Check className="mr-2 h-4 w-4" />
                                                {processing
                                                    ? 'Saving...'
                                                    : 'Save Changes'}
                                            </Button>
                                        </>
                                    ) : (
                                        <Button
                                            type="button"
                                            onClick={() => setIsEditing(true)}
                                            variant="blue"
                                            className="h-10 px-5 font-semibold"
                                        >
                                            <Pencil className="mr-2 h-4 w-4" />
                                            Edit Profile
                                        </Button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {isEditing ? (
                    /* Edit Form View */
                    <form
                        id="user-edit-form"
                        onSubmit={handleSubmit}
                        className="space-y-6"
                    >
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                            {/* Account Credentials Card */}
                            <Card className="border-border/70 py-5 shadow-xs">
                                <CardHeader className="border-b border-border/50 pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E7F0E5] text-[#1F4B32] dark:bg-emerald-950 dark:text-emerald-400">
                                            <UserIcon className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg font-semibold">
                                                Account Details
                                            </CardTitle>
                                            <CardDescription>
                                                Update primary profile
                                                credentials
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-5 pb-6">
                                    <div className="space-y-1.5">
                                        <Label
                                            htmlFor="edit-name"
                                            className="text-xs font-semibold tracking-wider text-muted-foreground uppercase"
                                        >
                                            Full Name
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="edit-name"
                                                type="text"
                                                value={data.name}
                                                onChange={(e) =>
                                                    setData(
                                                        'name',
                                                        e.target.value,
                                                    )
                                                }
                                                className="pl-9"
                                            />
                                            <UserIcon className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
                                        </div>
                                        {errors.name && (
                                            <p className="text-xs font-medium text-destructive">
                                                {errors.name}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label
                                            htmlFor="edit-email"
                                            className="text-xs font-semibold tracking-wider text-muted-foreground uppercase"
                                        >
                                            Email Address
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="edit-email"
                                                type="email"
                                                value={data.email}
                                                onChange={(e) =>
                                                    setData(
                                                        'email',
                                                        e.target.value,
                                                    )
                                                }
                                                className="pl-9"
                                            />
                                            <Mail className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
                                        </div>
                                        {errors.email && (
                                            <p className="text-xs font-medium text-destructive">
                                                {errors.email}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label
                                            htmlFor="edit-username"
                                            className="text-xs font-semibold tracking-wider text-muted-foreground uppercase"
                                        >
                                            Username
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="edit-username"
                                                type="text"
                                                value={data.username}
                                                onChange={(e) =>
                                                    setData(
                                                        'username',
                                                        e.target.value,
                                                    )
                                                }
                                                className="pl-9"
                                            />
                                            <AtSign className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
                                        </div>
                                        {errors.username && (
                                            <p className="text-xs font-medium text-destructive">
                                                {errors.username}
                                            </p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Roles Selection Card */}
                            <Card className="border-border/70 py-5 shadow-xs">
                                <CardHeader className="border-b border-border/50 pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E7F0E5] text-[#1F4B32] dark:bg-emerald-950 dark:text-emerald-400">
                                            <Shield className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg font-semibold">
                                                Assigned Security Roles
                                            </CardTitle>
                                            <CardDescription>
                                                Select access roles for this
                                                user
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-5">
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        {availableRoles.map((role) => {
                                            const isChecked =
                                                data.roles.includes(role.name);
                                            const isSelfAdminRole =
                                                isSelf &&
                                                isChecked &&
                                                (role.name === 'super_admin' ||
                                                    role.name === 'manager' ||
                                                    role.name === 'admin');

                                            return (
                                                <div
                                                    key={role.id}
                                                    className={`flex items-start gap-3 rounded-xl border p-3.5 transition-all ${
                                                        isChecked
                                                            ? 'border-emerald-300 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20'
                                                            : 'border-border/60 bg-card hover:bg-accent/40'
                                                    }`}
                                                >
                                                    <Checkbox
                                                        id={`edit-role-${role.name}`}
                                                        checked={isChecked}
                                                        disabled={
                                                            isSelfAdminRole
                                                        }
                                                        onCheckedChange={(
                                                            value,
                                                        ) =>
                                                            toggleRole(
                                                                role.name,
                                                                !!value,
                                                            )
                                                        }
                                                        className="mt-0.5"
                                                    />
                                                    <div className="space-y-1">
                                                        <Label
                                                            htmlFor={`edit-role-${role.name}`}
                                                            className="cursor-pointer font-semibold text-foreground"
                                                        >
                                                            {role.name}
                                                        </Label>
                                                        {isSelfAdminRole && (
                                                            <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                                                                Cannot remove
                                                                own admin role
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {errors.roles && (
                                        <p className="mt-2 text-xs font-medium text-destructive">
                                            {errors.roles}
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Direct Permissions Section */}
                        <Card className="border-border/70 py-5 shadow-xs">
                            <CardHeader className="border-b border-border/50 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E7F0E5] text-[#1F4B32] dark:bg-emerald-950 dark:text-emerald-400">
                                        <Key className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg font-semibold">
                                            Direct Permissions
                                        </CardTitle>
                                        <CardDescription>
                                            Grant explicit individual module
                                            permissions
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-5">
                                <PermissionChecklist
                                    permissionGroups={permissionGroups}
                                    resourceLabels={resourceLabels}
                                    selected={data.permissions}
                                    onChange={(permissions) =>
                                        setData('permissions', permissions)
                                    }
                                />
                            </CardContent>
                        </Card>
                    </form>
                ) : (
                    /* View Mode Layout */
                    <div className="space-y-6">
                        {/* Summary Tiles Grid */}
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                            {/* Account Details Card */}
                            <Card className="border-border/70 py-5 shadow-xs">
                                <CardHeader className="border-b border-border/50 pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E7F0E5] text-[#1F4B32] dark:bg-emerald-950 dark:text-emerald-400">
                                            <UserIcon className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg font-semibold">
                                                Account Overview
                                            </CardTitle>
                                            <CardDescription>
                                                User profile information &
                                                identity
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 gap-4 pt-5 pb-6 sm:grid-cols-2">
                                    <div className="bg-subtle rounded-xl border border-border/50 p-3.5 dark:bg-zinc-900/40">
                                        <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                            Full Name
                                        </p>
                                        <p className="mt-1 font-semibold text-foreground">
                                            {user.name}
                                        </p>
                                    </div>

                                    <div className="bg-subtle rounded-xl border border-border/50 p-3.5 dark:bg-zinc-900/40">
                                        <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                            Username
                                        </p>
                                        <p className="mt-1 font-semibold text-foreground">
                                            @{user.username}
                                        </p>
                                    </div>

                                    <div className="bg-subtle rounded-xl border border-border/50 p-3.5 dark:bg-zinc-900/40">
                                        <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                            Email Address
                                        </p>
                                        <p className="mt-1 truncate font-semibold text-foreground">
                                            {user.email}
                                        </p>
                                    </div>

                                    <div className="bg-subtle rounded-xl border border-border/50 p-3.5 dark:bg-zinc-900/40">
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                                Password Protection
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setChangePasswordOpen(true)
                                                }
                                                className="flex items-center gap-1 text-xs font-semibold text-[#1F4B32] hover:underline dark:text-emerald-400"
                                            >
                                                <KeyRound className="h-3 w-3" />
                                                Change
                                            </button>
                                        </div>
                                        <p className="mt-1 font-mono text-sm text-muted-foreground">
                                            •••••••• (Server Encrypted)
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Role & Access Summary Card */}
                            <Card className="border-border/70 py-5 shadow-xs">
                                <CardHeader className="border-b border-border/50 pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E7F0E5] text-[#1F4B32] dark:bg-emerald-950 dark:text-emerald-400">
                                            <ShieldCheck className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg font-semibold">
                                                Assigned Roles & Access Level
                                            </CardTitle>
                                            <CardDescription>
                                                Active security roles and
                                                authorization privileges
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-5 pb-6">
                                    <div>
                                        <p className="mb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                            Active Roles
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {(user.roles ?? []).length === 0 ? (
                                                <span className="text-sm text-muted-foreground italic">
                                                    No roles assigned
                                                </span>
                                            ) : (
                                                (user.roles ?? []).map(
                                                    (role) => (
                                                        <Badge
                                                            key={role}
                                                            variant="secondary"
                                                            className="border border-emerald-200 bg-[#E7F0E5] px-3 py-1 text-sm font-semibold text-[#1F4B32] dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
                                                        >
                                                            <Shield className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
                                                            {role}
                                                        </Badge>
                                                    ),
                                                )
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-subtle rounded-xl border border-border/50 p-4 dark:bg-zinc-900/40">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-foreground">
                                                Direct Extra Permissions
                                            </span>
                                            <Badge
                                                variant="outline"
                                                className="font-semibold"
                                            >
                                                {
                                                    (user.permissions ?? [])
                                                        .length
                                                }{' '}
                                                Granted
                                            </Badge>
                                        </div>
                                        <div className="mt-2 flex items-center justify-between">
                                            <span className="text-sm font-medium text-foreground">
                                                Total Effective Permissions
                                            </span>
                                            <Badge
                                                variant="secondary"
                                                className="font-semibold"
                                            >
                                                {user.is_super_admin
                                                    ? 'Unlimited (Full Access)'
                                                    : `${effectivePermissions.length} Active`}
                                            </Badge>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Effective Permissions Interactive Section */}
                        <Card className="border-border/70 py-5 shadow-xs">
                            <CardHeader className="border-b border-border/50 pb-4">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E7F0E5] text-[#1F4B32] dark:bg-emerald-950 dark:text-emerald-400">
                                            <Key className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg font-semibold">
                                                Effective Module Permissions
                                            </CardTitle>
                                            <CardDescription>
                                                {user.is_super_admin
                                                    ? 'Super Admin has access to all capabilities in the application'
                                                    : 'Calculated combination of role and direct permissions'}
                                            </CardDescription>
                                        </div>
                                    </div>

                                    {/* Permission Search Bar */}
                                    <div className="relative w-full sm:w-64">
                                        <Input
                                            type="text"
                                            placeholder="Search permissions..."
                                            value={permissionSearch}
                                            onChange={(e) =>
                                                setPermissionSearch(
                                                    e.target.value,
                                                )
                                            }
                                            className="h-9 pl-8 text-xs"
                                        />
                                        <Search className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-muted-foreground" />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-5 pb-6">
                                {Object.keys(groupedEffectivePermissions)
                                    .length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                                        <XCircle className="mb-2 h-8 w-8 text-muted-foreground/50" />
                                        <p className="text-sm font-medium">
                                            No matching permissions found
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                                        {Object.entries(
                                            groupedEffectivePermissions,
                                        ).map(([groupLabel, perms]) => (
                                            <div
                                                key={groupLabel}
                                                className="bg-subtle/50 hover:bg-subtle space-y-2.5 rounded-xl border border-border/60 p-4 transition-all dark:bg-zinc-900/30"
                                            >
                                                <div className="flex items-center justify-between border-b border-border/40 pb-2">
                                                    <h3 className="text-xs font-bold tracking-wider text-foreground uppercase">
                                                        {groupLabel}
                                                    </h3>
                                                    <Badge
                                                        variant="outline"
                                                        className="text-[10px] font-semibold"
                                                    >
                                                        {perms.length}
                                                    </Badge>
                                                </div>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {perms.map((p) => (
                                                        <Badge
                                                            key={p}
                                                            variant="outline"
                                                            className="border-emerald-200/80 bg-emerald-50/60 font-mono text-[11px] text-[#1F4B32] dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300"
                                                        >
                                                            <CheckCircle2 className="mr-1 h-3 w-3 text-emerald-600" />
                                                            {p}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>

            <ChangePasswordModal
                open={changePasswordOpen}
                onOpenChange={setChangePasswordOpen}
            />
        </AppLayout>
    );
}
