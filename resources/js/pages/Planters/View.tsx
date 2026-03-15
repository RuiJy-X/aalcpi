/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable import/order */
import { Head, Link } from '@inertiajs/react';
import { User, ShieldCheck } from 'lucide-react';
import ActionContainer from '@/components/action-container';
import { router } from '@inertiajs/react';

import Heading from '@/components/heading';
import {
    certificationBulkDelete,
    landBulkDelete,
    productionBulkDelete,
} from '@/components/data-table/bulk-delete';
import { certificationColumns } from '@/components/data-table/certification-columns';
import { DataTable } from '@/components/data-table/data-table';
import { productionColumns } from '@/components/data-table/production-columns';
import { Plus } from 'lucide-react';
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
import { create as createLand } from '@/routes/lands';
import { show as landShow } from '@/routes/lands';
import { show as productionShow } from '@/routes/productions';
import type { BreadcrumbItem } from '@/types';
import { useState } from 'react';
import PersonalInfo from '@/components/planters/planter-view/personal-info';
import LandsInfo from '@/components/planters/planter-view/lands-info';
import { show as planterShow } from '@/routes/planters';
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
    const viewHref = planterShow(planter.id).url;
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
            <ActionContainer className="flex gap-2">
                <Tabs
                    value={activeTab}
                    defaultValue="planters"
                    className="w-fit"
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
                <Button
                    variant="outline"
                    onClick={() => router.get(createLand(planter.id).url)}
                >
                    <i>
                        <Plus />
                    </i>
                    Add Land
                </Button>
            </ActionContainer>
            <ViewLayout>
                <Heading
                    title="View Planter Details"
                    description="Viewing planter details of a specific planter"
                />
                {activeTab === 'planters' && <PersonalInfo planter={planter} />}
                {activeTab === 'lands' && (
                    <DataTable
                        data={lands}
                        columns={landColumns}
                        bulkDelete={landBulkDelete}
                        onRowDoubleClick={(land) => landShow(land.id).url}
                    />
                )}
                {activeTab === 'productions' && (
                    <DataTable
                        columns={productionColumns}
                        data={productions}
                        bulkDelete={productionBulkDelete}
                        onRowDoubleClick={(production) =>
                            productionShow(production.id).url
                        }
                    />
                )}
                {activeTab === 'certifications' && (
                    <DataTable
                        columns={certificationColumns}
                        data={certifications}
                        bulkDelete={certificationBulkDelete}
                    />
                )}
            </ViewLayout>
        </AppLayout>
    );
}
