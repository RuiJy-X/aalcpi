/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable import/order */
import { Head } from '@inertiajs/react';
import Heading from '@/components/heading';
import type { ProductionRow } from '@/components/planters/planters-table-types';
import AppLayout from '@/layouts/app-layout';
import { index as plantersIndex } from '@/routes/planters';
import { show as planterShow } from '@/routes/planters';
import { index as productionIndex } from '@/routes/productions';
import { show as productionShow } from '@/routes/productions';
import type { BreadcrumbItem } from '@/types';
import ProductionInfo from '@/components/planters/planter-view/production-info';

export default function Index({
    production,
    planterName,
}: {
    production: ProductionRow;
    planterName: string;
}) {
    const viewHref = planterShow(production.planter_id).url;
    const viewProductionHref = productionShow([production.id]).url;

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
            title: `${planterName}`,
            href: viewHref,
        },
        {
            title: 'Production Details',
            href: viewProductionHref,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Products">
                <title>Planters</title>
            </Head>
            <div className="mx-5 my-5">
                <Heading
                    title={planterName}
                    description="View a Planter's Production Details"
                />
                <ProductionInfo production={production} />
            </div>
        </AppLayout>
    );
}
