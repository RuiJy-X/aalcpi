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
import { index as plantersIndex } from '@/routes/planters';
import { create as createPage } from '@/routes/planters';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Planter Management',
        href: plantersIndex().url,
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
    {
        title: 'Register Planter',
        href: createPage().url,
        icon: User,
    },
    {
        title: 'Add Production',
        href: '#',
        icon: Clipboard,
    },
    {
        title: 'Generate Certificate',
        href: '#',
        icon: ShieldCheck,
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
            <Head title="Planters">
                <title>Planters</title>
            </Head>
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
            {/* <PlantersTabsTable data={planters} />
             */}

            <div className="container mx-4">
                <Tabs
                    value={activeTab}
                    defaultValue="planters"
                    className="w-[400px]"
                    onValueChange={setActiveTab}
                >
                    <TabsList className="">
                        <TabsTrigger value="planters">
                            <User />
                            Planters
                        </TabsTrigger>
                        <TabsTrigger value="productions">
                            <Clipboard />
                            Productions
                        </TabsTrigger>
                        <TabsTrigger value="certifications">
                            <ShieldCheck />
                            Certifications
                        </TabsTrigger>
                        <TabsTrigger value="lands">
                            <LandPlot />
                            Lands
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>
            <div className="container-full px-3 py-2">
                {activeTab === 'planters' && (
                    <DataTable columns={planterColumns} data={planters} />
                )}
                {activeTab === 'productions' && (
                    <DataTable columns={productionColumns} data={productions} />
                )}
                {activeTab === 'certifications' && (
                    <DataTable
                        columns={certificationColumns}
                        data={certifications}
                    />
                )}
                {activeTab === 'lands' && (
                    <DataTable columns={landColumns} data={lands} />
                )}
            </div>
        </AppLayout>
    );
}
