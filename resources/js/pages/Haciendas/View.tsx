import { Head } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import ActionContainer from '@/components/action-container';
import Heading from '@/components/heading';
import HaciendasInfo from '@/components/haciendas/haciendas-info';
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
import PlanterCard from '@/components/planters/planter-view/planter-card';
import HaciendaCard from '@/components/planters/planter-view/haciendas/hacienda-card';

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
                <div className="mb-2 border-green-900 py-2 text-3xl font-semibold tracking-tight text-[var(--dark)]">
                    Hacienda Details
                </div>
                <div className="flex gap-3">
                    <PlanterCard planter={planter} className="flex-1" />
                    <HaciendaCard hacienda={hacienda} className="flex-1" />
                </div>
                <HaciendasInfo hacienda={hacienda} />
            </ViewLayout>
        </AppLayout>
    );
}
