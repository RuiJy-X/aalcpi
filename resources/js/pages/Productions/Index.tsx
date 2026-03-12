import { Head, Link } from '@inertiajs/react';
import { Clipboard, Import, Minimize2 } from 'lucide-react';
import ActionContainer from '@/components/action-container';

import { productionBulkDelete } from '@/components/data-table/bulk-delete';
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
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Production Management',
        href: productionsIndex().url,
    },
];

const actions = [
    {
        title: 'Import Data',
        href: '#',
        icon: Import,
    },
    {
        title: 'Add Production',
        href: '#',
        icon: Clipboard,
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
            <ActionContainer className="">
                {actions.map((action) => (
                    <Link key={action.title} href={action.href}>
                        <Button variant={'outline'}>
                            <span>
                                <action.icon />
                            </span>
                            {action.title}
                        </Button>
                    </Link>
                ))}
            </ActionContainer>

            <StatsContainer label="Production Statistics">
                <ProductionStats
                    productions={productions}
                    planters={planters}
                />
            </StatsContainer>

            <div className="container-full px-3 py-2">
                <DataTable
                    columns={productionColumns}
                    data={productions}
                    bulkDelete={productionBulkDelete}
                />
            </div>
        </AppLayout>
    );
}
