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

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Planter Management',
        href: plantersIndex().url,
    },
];

export default function Index({
    planters,
    productions,
    certifications,
    haciendas,
}: {
    planters: PlanterRow[];
    productions: ProductionRow[];
    certifications: CertificationRow[];
    haciendas: HaciendaRow[];
}) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Planters">
                <title>Planters</title>
            </Head>
            <ActionContainer className="">
                <ImportDialog config={plantersImportConfig} />
                <Button
                    variant="outline"
                    onClick={() => router.get(createPage().url)}
                >
                    <User />
                    Register Planter
                </Button>
            </ActionContainer>

            <StatsContainer label="Planter Stats">
                <PlanterStats
                    planters={planters}
                    productions={productions}
                    certifications={certifications}
                    haciendas={haciendas}
                />
            </StatsContainer>

            <div className="container-full px-3 py-2">
                <DataTable
                    columns={planterColumns}
                    data={planters}
                    bulkDelete={planterBulkDelete}
                    onRowDoubleClick={(planter) => planterShow(planter.id).url}
                />
            </div>
        </AppLayout>
    );
}
