import { Head, Link } from '@inertiajs/react';
import {
    BookOpen,
    Clipboard,
    Import,
    LandPlot,
    ShieldCheck,
    User,
} from 'lucide-react';
import { useState } from 'react';
import ActionContainer from '@/components/action-container';
import { certificationBulkDelete } from '@/components/data-table/bulk-delete';
import { certificationColumns } from '@/components/data-table/certification-columns';
import { DataTable } from '@/components/data-table/data-table';
import { landColumns } from '@/components/data-table/land-columns';
import { planterColumns } from '@/components/data-table/planter-columns';
import { productionColumns } from '@/components/data-table/production-columns';
import type {
    PlanterRow,
    ProductionRow,
    CertificationRow,
    LandRow,
} from '@/components/planters/planters-table-types';
// import PlantersTabsTable from '@/components/planters/planters-tabs-table';
import StatCard from '@/components/stat-card';
import StatsContainer from '@/components/stats-container';
import { Button } from '@/components/ui/button';
import { Tabs, TabsTrigger, TabsList } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { index as certificationIndex } from '@/routes/certifications';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Certifications Management',
        href: certificationIndex().url,
    },
];

const tabs = [
    {
        title: 'Planters',
        value: 'planters',
        icon: User,
    },
    {
        title: 'Productions',
        value: 'productions',
        icon: BookOpen,
    },
    {
        title: 'Certifications',
        value: 'certifications',
        icon: ShieldCheck,
    },
    {
        title: 'Lands',
        value: 'lands',
        icon: LandPlot,
    },
];

const actions = [
    {
        title: 'Import Data',
        href: '#',
        icon: Import,
    },
];

export default function Index({
    planters,
    productions,
    certifications,
    lands,
}: {
    planters: PlanterRow[];
    productions: ProductionRow[];
    certifications: CertificationRow[];
    lands: LandRow[];
}) {
    const [activeTab, setActiveTab] = useState('planters');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Lands"></Head>
            <ActionContainer className="">
                {actions.map((action) => (
                    <Link key={action.title} href={action.href}>
                        <Button variant={'outline'}>
                            <span>
                                <action.icon />
                            </span>
                            {action.title}
                        </Button>
                    </Link>
                ))}
            </ActionContainer>

            <StatsContainer className="flex-wrap bg-card">
                {tabs.map((tab) => (
                    <StatCard
                        key={tab.value}
                        title={tab.title}
                        value="1,233"
                        icon={tab.icon}
                        color="green"
                    />
                ))}
            </StatsContainer>

            <div className="container-full px-3 py-2">
                <DataTable
                    columns={certificationColumns}
                    data={certifications}
                    bulkDelete={certificationBulkDelete}
                />
            </div>
        </AppLayout>
    );
}
