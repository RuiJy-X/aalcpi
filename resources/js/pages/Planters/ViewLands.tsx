/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable import/order */
import { Head } from '@inertiajs/react';
import Heading from '@/components/heading';
import type { LandRow } from '@/components/planters/planters-table-types';
import AppLayout from '@/layouts/app-layout';
import { index as plantersIndex } from '@/routes/planters';
import { show as planterShow } from '@/routes/planters';
import type { BreadcrumbItem } from '@/types';
import ViewLayout from '@/components/planters/planter-view/view-layout';
import LandsInfo from '@/components/planters/planter-view/lands-info';
export default function Index({
    land,
    planterName,
}: {
    land: LandRow;
    planterName: string;
}) {
    const viewHref = planterShow(land.planter_id).url;
    const viewProductionHref =
        planterShow(land.planter_id).url + '/land/' + land.id;

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
            title: 'Land Details',
            href: viewProductionHref,
        },
    ];
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Products">
                <title>Planters</title>
            </Head>
            <ViewLayout>
                <Heading
                    title="View a Planter's Land Details"
                    description="Viewing planter details of a specific planter"
                />
                <LandsInfo land={land} />
            </ViewLayout>
        </AppLayout>
    );
}
