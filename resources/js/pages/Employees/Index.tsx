import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { index as employeeIndex } from '@/routes/employees';
import type { BreadcrumbItem } from '@/types';
import ActionContainer from '@/components/action-container';
import { Button } from '@/components/ui/button';
import StatsContainer from '@/components/stats-container';
import StatCard from '@/components/stat-card';
import { User, BookOpen, Clipboard, Briefcase } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Employee Management',
        href: employeeIndex().url,
    },
];

export default function Dashboard() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Employee Management">
                <title>Employee Management</title>
            </Head>
            <ActionContainer className="">
                <Link href={''}>
                    <Button>Register Employee</Button>
                </Link>
            </ActionContainer>
            <StatsContainer className="flex-wrap bg-card">
                <StatCard
                    title="Employees"
                    value="233"
                    icon={Briefcase}
                    color="green"
                />
            </StatsContainer>
        </AppLayout>
    );
}
