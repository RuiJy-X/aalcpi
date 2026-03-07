/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable import/order */
import { Head } from '@inertiajs/react';
import Heading from '@/components/heading';
import type {
    CertificationRow,
    LandRow,
} from '@/components/planters/planters-table-types';
import AppLayout from '@/layouts/app-layout';
import { index as plantersIndex } from '@/routes/planters';
import { info as plantersView } from '@/routes/planters/view';
import type { BreadcrumbItem } from '@/types';

export default function Index({
    certificate,
    planterName,
}: {
    certificate: CertificationRow;
    planterName: string;
}) {
    const viewHref = plantersView(certificate.planter_id).url;
    const viewProductionHref =
        plantersView(certificate.planter_id).url +
        '/certificate/' +
        certificate.id;

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
            title: 'Certificate Details',
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
                    title="View a Planter's Certificate Details"
                    description="Viewing planter details of a specific planter"
                />
            </div>
        </AppLayout>
    );
}
