import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { index as employeeIndex } from '@/routes/Employees';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Employees',
        href: employeeIndex().url,
    },
];

export default function Dashboard() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Employees" />
        </AppLayout>
    );
}
