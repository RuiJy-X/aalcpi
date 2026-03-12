/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable import/order */
import { Head } from '@inertiajs/react';
import Heading from '@/components/heading';
import type {
    ProductionRow,
    PlanterRow,
    LandRow,
} from '@/components/planters/planters-table-types';
import AppLayout from '@/layouts/app-layout';
import { show as planterShow } from '@/routes/planters';
import { index as productionsIndex } from '@/routes/productions';
import { show as landShow } from '@/routes/lands';
import { show as productionShow } from '@/routes/productions';
import type { BreadcrumbItem } from '@/types';
import ProductionInfo from '@/components/planters/planter-view/production-info';
import PersonalInfo from '@/components/planters/planter-view/personal-info';

export default function Index({
    production,
    planter,
    land,
}: {
    production: ProductionRow;
    planter: PlanterRow;
    land: LandRow;
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
            title: `${land.name}`,
            href: landShow(land.id).url,
        },
        {
            title: `${production.trans_code}`,
            href: productionShow(production.id).url,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Products">
                <title>Planters</title>
            </Head>
            <div className="mx-5 my-5">
                <Heading
                    title={planter.name}
                    description="View a Planter's Production Details"
                />
                <div className="flex flex-col gap-3">
                    <PersonalInfo planter={planter} />
                    <ProductionInfo production={production} />
                </div>
            </div>
        </AppLayout>
    );
}
