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
import AppLayout from '@/layouts/app-layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import ContentLayout from '@/layouts/app/content-layout';

export default function Index({
    planter,
    haciendas,
    productions,
    certifications,
    crop_years,
    weeks_by_crop_year,
    filters,
}: {
    planter: PlanterWithRelations;
    haciendas: HaciendaRow[];
    productions: ProductionRow[];
    certifications: CertificationRow[];
    crop_years: string[];
    weeks_by_crop_year: Record<string, number[]>;
    filters: {
        crop_year: string;
        week_no: string;
        view_mode: string;
    };
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
            <ContentLayout>
                <Head title="Products">
                    <title>Planters</title>
                </Head>
                <div className="flex gap-2">
                    <Tabs
                        value={activeTab}
                        defaultValue="planters"
                        className="w-fit"
                        onValueChange={setActiveTab}
                    >
                        <TabsList className="" variant="line">
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
                </div>
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
                        <PlanterViewProductions
                            productions={productions}
                            crop_years={crop_years}
                            weeks_by_crop_year={weeks_by_crop_year}
                            filters={filters}
                            planter_id={planter.id}
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
            </ContentLayout>
        </AppLayout>
    );
}
