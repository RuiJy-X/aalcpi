import { Head, Link, router } from '@inertiajs/react';
import { Import, User } from 'lucide-react';
import ActionContainer from '@/components/action-container';
import { DataTable } from '@/components/data-table/data-table';
import { planterBulkDelete } from '@/components/data-table/bulk-delete';
import { planterColumns } from '@/components/data-table/planter-columns';

import type {
    PlanterRow,
    ProductionRow,
    CertificationRow,
    HaciendaRow,
} from '@/components/planters/planters-table-types';

import PlanterStats from '@/components/planters/stat-cards/PlanterStats';
import StatsContainer from '@/components/stats-container';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { index as plantersIndex } from '@/routes/planters';
import { create as createPage } from '@/routes/planters';
import { show as planterShow } from '@/routes/planters';
import type { BreadcrumbItem } from '@/types';
import { ImportDialog } from '@/components/import/import-dialog';
import { plantersImportConfig } from '@/components/import/import-config';
import {
    Container,
    ContainerHeader,
    ContainerHeaderEnd,
} from '@/components/container';
import PlanterCard from '@/components/planters/planter-view/planter-card';
import PlanterCardsDisplay from '@/components/planters/planter-card-display';
import ContentLayout from '@/layouts/app/content-layout';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Planter Management',
        href: plantersIndex().url,
    },
];

export default function Index({
    planters,
    productions,
    haciendas,
}: {
    planters: PlanterRow[];
    productions: ProductionRow[];
    haciendas: HaciendaRow[];
}) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Planters">
                <title>Planters</title>
            </Head>

            <div className="m-3 flex gap-2">
                <PlanterStats
                    planters={planters}
                    productions={productions}
                    haciendas={haciendas}
                />
            </div>
            <PlanterCardsDisplay planters={planters} />

            <Container>
                <ContainerHeader>
                    Planters Table
                    <ContainerHeaderEnd>
                        <ImportDialog config={plantersImportConfig} />
                        <Button
                            variant="outline"
                            onClick={() => router.get(createPage().url)}
                        >
                            <User />
                            Register Planter
                        </Button>
                    </ContainerHeaderEnd>
                </ContainerHeader>
                <DataTable
                    columns={planterColumns}
                    data={planters}
                    bulkDelete={planterBulkDelete}
                    onRowDoubleClick={(planter) => planterShow(planter.id).url}
                />
            </Container>
        </AppLayout>
    );
}
