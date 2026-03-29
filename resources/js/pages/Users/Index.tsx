import { Head } from '@inertiajs/react';
import { DataTable } from '@/components/data-table/data-table';
import AppLayout from '@/layouts/app-layout';
import { index as userIndex } from '@/routes/users';
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
                <ContainerHeader>Create a new User</ContainerHeader>
                <CreateUserForm />
            </Container>

            <Container>
                <ContainerHeader>
                    Users Table
                    <ContainerHeaderEnd></ContainerHeaderEnd>
                </ContainerHeader>
                <DataTable
                    columns={usersColumns}
                    data={users}
                    onRowDoubleClick={(user) => userShow(user.id).url}
                />
            </Container>
        </AppLayout>
    );
}
