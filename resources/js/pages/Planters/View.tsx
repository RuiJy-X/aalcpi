/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable import/order */
import { Head, Link } from '@inertiajs/react';
import { User, ShieldCheck } from 'lucide-react';
import ActionContainer from '@/components/action-container';

import Heading from '@/components/heading';
import { certificationColumns } from '@/components/data-table/certification-columns';
import { DataTable } from '@/components/data-table/data-table';
import { productionColumns } from '@/components/data-table/production-columns';
import type {
    CertificationRow,
    LandRow,
    PlanterRow,
    ProductionRow,
} from '@/components/planters/planters-table-types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { TabsTrigger, TabsList, Tabs } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { index as plantersIndex } from '@/routes/planters';
import { create as createPage } from '@/routes/planters';
import type { BreadcrumbItem } from '@/types';
import { useState } from 'react';
import PersonalInfo from '@/components/planters/planter-view/personal-info';
import LandsInfo from '@/components/planters/planter-view/lands-info';
import { view as plantersView } from '@/routes/planters';
import ViewLayout from '@/components/planters/planter-view/view-layout';
import { landColumns } from '@/components/data-table/land-columns';

export default function Index({
    planter,
    lands,
    productions,
    certifications,
}: {
    planter: PlanterRow;
    lands: LandRow[];
    productions: ProductionRow[];
    certifications: CertificationRow[];
}) {
    const [activeTab, setActiveTab] = useState('planters');
    const viewHref = plantersView(planter.id).url;
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Planter Management',
            href: plantersIndex().url,
        },
        {
            title: 'Planter Details',
            href: viewHref,
        },
        {
            title: `${planter.name}`,
            href: viewHref,
        },
    ];
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Products">
                <title>Planters</title>
            </Head>
            <ActionContainer className="">
                <Tabs
                    value={activeTab}
                    defaultValue="planters"
                    className="w-[400px]"
                    onValueChange={setActiveTab}
                >
                    <TabsList className="">
                        <TabsTrigger value="planters">
                            <User />
                            Planter Info
                        </TabsTrigger>
                        <TabsTrigger value="productions">
                            <User />
                            Productions
                        </TabsTrigger>
                        <TabsTrigger value="lands">
                            <User />
                            Lands
                        </TabsTrigger>
                        <TabsTrigger value="certifications">
                            <User />
                            Certifications
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </ActionContainer>
            <ViewLayout>
                <Heading
                    title="View Planter Details"
                    description="Viewing planter details of a specific planter"
                />
                {activeTab === 'planters' && <PersonalInfo planter={planter} />}
                {activeTab === 'lands' && (
                    <DataTable data={lands} columns={landColumns} />
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
            </ViewLayout>
        </AppLayout>
    );
}
