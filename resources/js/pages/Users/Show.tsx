import { Head, useForm } from '@inertiajs/react';
import { DataTable } from '@/components/data-table/data-table';
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
import CreateUserForm from '@/components/users/create-user-form';
import { usersColumns } from '@/components/data-table/users-columns';
import type { UserRow } from '@/components/types/usertypes';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { preview } from '@/routes/imports';
import { Input } from '@/components/ui/input';
import password from '@/routes/password';
import { EyeOff, Eye } from 'lucide-react';

export default function Index({ user }: { user: UserRow }) {
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
        role: user.role || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(userUpdate(user.id).url, {
            onSuccess: () => {
                setIsEditing(false);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Users"></Head>

            <Container>
                <ContainerHeader>
                    <h1 className="text-2xl font-semibold">User Information</h1>
                    <ContainerHeaderEnd>
                        {isEditing && (
                            <Button
                                type={'submit'}
                                form={isEditing ? 'user-edit-form' : undefined} // 2. Link it to the form ID
                                disabled={processing}
                                variant="blue"
                                onClick={() => {
                                    // 3. Only toggle manually if we are entering edit mode.
                                    // When saving, handleSubmit will close it via onSuccess.
                                    if (!isEditing) {
                                        setIsEditing(true);
                                    }
                                }}
                            >
                                {processing ? 'Saving...' : 'Done'}
                            </Button>
                        )}

                        <Button
                            type="button"
                            variant={isEditing ? 'destructive' : 'blue'}
                            onClick={() => {
                                if (!isEditing) {
                                    setIsEditing(true);
                                } else {
                                    setIsEditing(false);
                                    reset(); // Reset form data to original values when canceling edit mode
                                }
                            }}
                        >
                            {isEditing ? 'Cancel' : 'Edit'}
                        </Button>
                    </ContainerHeaderEnd>
                </ContainerHeader>
                {isEditing ? (
                    <div className="">
                        <form id="user-edit-form" onSubmit={handleSubmit}>
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
                                                    setData(
                                                        'name',
                                                        e.target.value,
                                                    )
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
                                                    setData(
                                                        'email',
                                                        e.target.value,
                                                    )
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
                                                    } // Dynamically switches
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
                                    <tr>
                                        <td className="h-8 border border-gray-400 bg-secondary pr-5 font-semibold">
                                            Role:
                                        </td>
                                        <td className="h-8 w-full border border-gray-400 px-2 py-2">
                                            <Input
                                                type="text"
                                                value={data.role}
                                                onChange={(e) =>
                                                    setData(
                                                        'role',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                            {errors.role && (
                                                <p className="text-sm text-red-600">
                                                    {errors.role}
                                                </p>
                                            )}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </form>
                    </div>
                ) : (
                    <div className="">
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
                                        Role:
                                    </td>
                                    <td className="h-8 w-full border border-gray-400 bg-secondary px-2">
                                        {user.role}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}
            </Container>
        </AppLayout>
    );
}
