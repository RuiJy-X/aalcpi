import { Head } from '@inertiajs/react';
import { DataTable } from '@/components/data-table/data-table';
import AppLayout from '@/layouts/app-layout';
import { index as userIndex } from '@/routes/users';
import { show as userShow } from '@/routes/users';
import type { BreadcrumbItem } from '@/types';
import Container from '@/components/container';
import CreateUserForm from '@/components/users/create-user-form';
import { usersColumns } from '@/components/data-table/users-columns';
import type { UserRow } from '@/components/types/usertypes';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'User Management',
        href: userIndex().url,
    },
];

export default function Index({ users }: { users: UserRow[] }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Users"></Head>

            <Container>
                <h1 className="font-semibold">Create a new User</h1>
                <CreateUserForm />
            </Container>

            <Container>
                <h1 className="mb-5 font-semibold">Users Table</h1>
                <DataTable
                    columns={usersColumns}
                    data={users}
                    onRowDoubleClick={(user) => userShow(user.id).url}
                />
            </Container>
        </AppLayout>
    );
}
