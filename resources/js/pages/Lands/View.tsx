import { Head } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import ActionContainer from '@/components/action-container';
import Heading from '@/components/heading';
import LandsInfo from '@/components/planters/planter-view/lands-info';
import PersonalInfo from '@/components/planters/planter-view/personal-info';
import ViewLayout from '@/components/planters/planter-view/view-layout';
import type {
    PlanterRow,
    LandRow,
} from '@/components/planters/planters-table-types';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { index as landIndex } from '@/routes/lands';
import { show as landShow } from '@/routes/lands';
import { create as createLand } from '@/routes/lands';
import { show as planterShow } from '@/routes/planters';
import type { BreadcrumbItem } from '@/types';

export default function Index({
    planter,
    land,
}: {
    planter: PlanterRow;
    land: LandRow;
}) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Land Management',
            href: landIndex().url,
        },
        {
            title: 'Lands Details',
            href: landShow(land.id).url,
        },
        {
            title: `${planter.name}`,
            href: planterShow(planter.id).url,
        },
        {
            title: `${land.name}`,
            href: '',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Lands">
                <title>Lands</title>
            </Head>
            <ActionContainer>
                <Button onClick={() => router.get(createLand(planter.id).url)}>
                    <i>
                        <Plus />
                    </i>
                    Add Land
                </Button>
            </ActionContainer>
            <ViewLayout>
                <Heading
                    title="View a Planter's Land Details"
                    description="Viewing planter details of a specific planter"
                />
                <PersonalInfo planter={planter} />
                <LandsInfo land={land} />
            </ViewLayout>
        </AppLayout>
    );
}
