import { Head, Link } from '@inertiajs/react';
import { Clipboard, Import, Minimize2 } from 'lucide-react';
import ActionContainer from '@/components/action-container';

import { productionBulkDelete } from '@/components/data-table/bulk-delete';
import { productionBulkDownload } from '@/components/data-table/bulk-download';
import { DataTable } from '@/components/data-table/data-table';

import { productionColumns } from '@/components/data-table/production-columns';
import type {
    PlanterRow,
    ProductionRow,
} from '@/components/planters/planters-table-types';
// import PlantersTabsTable from '@/components/planters/planters-tabs-table';
import ProductionStats from '@/components/productions/stat-cards/ProductionStats';
import StatsContainer from '@/components/stats-container';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { index as productionsIndex } from '@/routes/productions';
import { show as productionShow } from '@/routes/productions';
import type { BreadcrumbItem } from '@/types';
import { ImportDialog } from '@/components/import/import-dialog';
import { productionsImportConfig } from '@/components/import/import-config';
import {
    Container,
    ContainerHeader,
    ContainerHeaderEnd,
} from '@/components/container';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Production Management',
        href: productionsIndex().url,
    },
];

export default function Index({
    planters,
    productions,
}: {
    planters: PlanterRow[];
    productions: ProductionRow[];
}) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Productions"></Head>

            <div className="m-3 flex gap-2 overflow-x-auto">
                <ProductionStats
                    productions={productions}
                    planters={planters}
                />
            </div>

            <Container>
                <ContainerHeader>
                    Final Productions Table
                    <ContainerHeaderEnd>
                        <ImportDialog config={productionsImportConfig} />
                    </ContainerHeaderEnd>
                </ContainerHeader>

                <DataTable
                    columns={productionColumns}
                    data={productions}
                    bulkDownload={productionBulkDownload}
                    bulkDelete={productionBulkDelete}
                    onRowDoubleClick={(production) =>
                        productionShow(production.id).url
                    }
                />
            </Container>
        </AppLayout>
    );
}
