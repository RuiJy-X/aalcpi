/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable import/order */
import { Head } from '@inertiajs/react';
import Heading from '@/components/heading';
import type {
    ProductionRow,
    PlanterRow,
    HaciendaRow,
} from '@/components/planters/planters-table-types';
import AppLayout from '@/layouts/app-layout';
import { show as planterShow } from '@/routes/planters';
import { index as productionsIndex } from '@/routes/productions';
import { show as haciendaShow } from '@/routes/haciendas';
import { show as productionShow } from '@/routes/productions';
import type { BreadcrumbItem } from '@/types';
import ProductionInfo from '@/components/productions/production-info';
import PersonalInfo from '@/components/planters/planter-view/personal-info';
import PlanterCard from '@/components/planters/planter-view/planter-card';
import HaciendaCard from '@/components/planters/planter-view/haciendas/hacienda-card';
import { Container, ContainerHeader } from '@/components/container';

export default function Index({
    production,
    planter,
    hacienda,
}: {
    production: ProductionRow;
    planter: PlanterRow;
    hacienda: HaciendaRow;
}) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Production Management',
            href: productionsIndex().url,
        },
        {
            title: 'Productions Details',
            href: productionShow(production.id).url,
        },
        {
            title: `${planter.name}`,
            href: planterShow(planter.id).url,
        },
        {
            title: `${hacienda.name}`,
            href: haciendaShow(hacienda.id).url,
        },
        {
            title: `${production.trans_code}`,
            href: productionShow(production.id).url,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Products">
                <title>Production Details</title>
            </Head>
            <div className="mx-5 my-5 flex flex-col gap-3">
                <div className="mb-2 border-green-900 py-2 text-3xl font-semibold tracking-tight text-[var(--dark)]">
                    Production Details
                </div>
                <div className="flex gap-3">
                    <PlanterCard planter={planter} className="flex-1" />
                    <HaciendaCard hacienda={hacienda} className="flex-1" />
                </div>
                <div className="flex flex-col gap-3">
                    <ProductionInfo production={production} />
                </div>
            </div>
        </AppLayout>
    );
}
