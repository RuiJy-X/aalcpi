import { Head, Link } from '@inertiajs/react';
import { BookOpen, Clipboard, User } from 'lucide-react';
import PlantersTabsTable from '@/components/planters/planters-tabs-table';
import StatCard from '@/components/stat-card';
import StatsContainer from '@/components/stats-container';
import AppLayout from '@/layouts/app-layout';
import { index as plantersIndex, create } from '@/routes/planters';
import type { BreadcrumbItem } from '@/types';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import ActionContainer from '@/components/action-container';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Planter Management',
        href: plantersIndex().url,
    },
];

export default function Index() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Products">
                <title>Planters</title>
            </Head>
            <ActionContainer className="">
                <Link href={create()}>
                    <Button>Register Planter</Button>
                </Link>
            </ActionContainer>
            <StatsContainer className="flex-wrap bg-card">
                <StatCard
                    title="Planters"
                    value="1,233"
                    icon={User}
                    color="green"
                />
                <StatCard
                    title="Certifications"
                    value="150"
                    icon={Clipboard}
                    color="green"
                />
                <StatCard
                    title="Records"
                    value="12,901"
                    icon={BookOpen}
                    color="green"
                />
            </StatsContainer>
            <PlantersTabsTable />
        </AppLayout>
    );
}
