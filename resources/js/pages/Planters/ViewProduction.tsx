/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable import/order */
import { Head } from '@inertiajs/react';
import Heading from '@/components/heading';
import type { ProductionRow } from '@/components/planters/planters-table-types';
import AppLayout from '@/layouts/app-layout';
import { index as plantersIndex } from '@/routes/planters';
import { info as plantersView } from '@/routes/planters/view';
import type { BreadcrumbItem } from '@/types';
import ProductionInfo from '@/components/planters/planter-view/production-info';

export default function Index({
    production,
    planterName,
}: {
    production: ProductionRow;
    planterName: string;
}) {
    const viewHref = plantersView(production.planter_id).url;
    const viewProductionHref =
        plantersView(production.planter_id).url +
        '/production/' +
        production.id;
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
