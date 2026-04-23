import { Head } from '@inertiajs/react';
import { DataTable } from '@/components/data-table/data-table';
import AppLayout from '@/layouts/app-layout';
import { index as userIndex } from '@/routes/users';
import { show as userShow } from '@/routes/users';
import type { BreadcrumbItem } from '@/types';
import { Container } from '@/components/container';
import CreateUserForm from '@/components/users/create-user-form';
import { usersColumns } from '@/components/data-table/users-columns';
import type { UserRow } from '@/components/types/usertypes';

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
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Users"></Head>

            <Container>
                <h1 className="mb-5 font-semibold">User Information</h1>
                <div className="">
                    <p>
                        <strong>Name:</strong> {user.name}
                    </p>
                    <p>
                        <strong>Email:</strong> {user.email}
                    </p>
                    <p>
                        <strong>Role:</strong> {user.role}
                    </p>
                </div>
            </Container>
        </AppLayout>
    );
}
