/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable import/order */
import { Head, Link } from '@inertiajs/react';
import { User, ShieldCheck } from 'lucide-react';
import ActionContainer from '@/components/action-container';
import { router } from '@inertiajs/react';

import Heading from '@/components/heading';
import {
    certificationBulkDelete,
    haciendaBulkDelete,
    productionBulkDelete,
} from '@/components/data-table/bulk-delete';
import { certificationColumns } from '@/components/data-table/certification-columns';
import { DataTable } from '@/components/data-table/data-table';
import { productionColumns } from '@/components/data-table/production-columns';
import { Plus } from 'lucide-react';
import type {
    CertificationRow,
    HaciendaRow,
    PlanterRow,
    PlanterWithRelations,
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
import { create as createHacienda } from '@/routes/haciendas';
import { show as haciendaShow } from '@/routes/haciendas';
import { show as productionShow } from '@/routes/productions';
import type { BreadcrumbItem } from '@/types';
import { useState } from 'react';
import PersonalInfo from '@/components/planters/planter-view/personal-info';
import HaciendasInfo from '@/components/haciendas/haciendas-info';
import { show as planterShow } from '@/routes/planters';
import ViewLayout from '@/components/planters/planter-view/view-layout';
import { haciendaColumns } from '@/components/data-table/hacienda-columns';
import PlanterViewPage from '@/components/planters/planter-view/planter-view-page';
import PlanterViewProductions from '@/components/planters/planter-view/planter-view-productions';
import PlanterViewHaciendas from '@/components/planters/planter-view/planter-view-haciendas';

export default function Index({
    planter,
    haciendas,
    productions,
    certifications,
}: {
    planter: PlanterWithRelations;
    haciendas: HaciendaRow[];
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
                        <TabsTrigger value="haciendas">
                            <User />
                            Haciendas
                        </TabsTrigger>
                        <TabsTrigger value="certifications">
                            <User />
                            Certifications
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
                <Button
                    variant="outline"
                    onClick={() => router.get(createHacienda(planter.id).url)}
                >
                    <i>
                        <Plus />
                    </i>
                    Add Hacienda
                </Button>
            </ActionContainer>
            <ViewLayout>
                {activeTab === 'planters' && (
                    <PlanterViewPage
                        planter={planter}
                        setActiveTab={setActiveTab}
                    />
                )}
                {activeTab === 'haciendas' && (
                    <PlanterViewHaciendas haciendas={haciendas} />
                )}
                {activeTab === 'productions' && (
                    <PlanterViewProductions productions={productions} />
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
