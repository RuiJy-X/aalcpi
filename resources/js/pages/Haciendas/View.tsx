import { Head } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import ActionContainer from '@/components/action-container';
import Heading from '@/components/heading';
import HaciendasInfo from '@/components/planters/planter-view/haciendas-info';
import PersonalInfo from '@/components/planters/planter-view/personal-info';
import ViewLayout from '@/components/planters/planter-view/view-layout';
import type {
    PlanterRow,
    HaciendaRow,
} from '@/components/planters/planters-table-types';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { index as haciendaIndex } from '@/routes/haciendas';
import { show as haciendaShow } from '@/routes/haciendas';
import { create as createHacienda } from '@/routes/haciendas';
import { show as planterShow } from '@/routes/planters';
import type { BreadcrumbItem } from '@/types';

export default function Index({
    planter,
    hacienda,
}: {
    planter: PlanterRow;
    hacienda: HaciendaRow;
}) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Hacienda Management',
            href: haciendaIndex().url,
        },
        {
            title: 'Haciendas Details',
            href: haciendaShow(hacienda.id).url,
        },
        {
            title: `${planter.name}`,
            href: planterShow(planter.id).url,
        },
        {
            title: `${hacienda.name}`,
            href: '',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Haciendas">
                <title>Haciendas</title>
            </Head>
            <ActionContainer>
                <Button
                    onClick={() => router.get(createHacienda(planter.id).url)}
                >
                    <i>
                        <Plus />
                    </i>
                    Add Hacienda
                </Button>
            </ActionContainer>
            <ViewLayout>
                <Heading
                    title="View a Planter's Hacienda Details"
                    description="Viewing planter details of a specific planter"
                />
                <PersonalInfo planter={planter} />
                <HaciendasInfo hacienda={hacienda} />
            </ViewLayout>
        </AppLayout>
    );
}
