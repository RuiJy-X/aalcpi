import { Head, Link } from '@inertiajs/react';
import { Import, User } from 'lucide-react';
import ActionContainer from '@/components/action-container';
import { DataTable } from '@/components/data-table/data-table';
import { planterBulkDelete } from '@/components/data-table/bulk-delete';
import { planterColumns } from '@/components/data-table/planter-columns';

import type {
    PlanterRow,
    ProductionRow,
    CertificationRow,
    LandRow,
} from '@/components/planters/planters-table-types';

import PlanterStats from '@/components/planters/stat-cards/PlanterStats';
import StatsContainer from '@/components/stats-container';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { index as plantersIndex } from '@/routes/planters';
import { create as createPage } from '@/routes/planters';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Planter Management',
        href: plantersIndex().url,
    },
];

const actions = [
    {
        title: 'Import Data',
        href: '#',
        icon: Import,
    },
    {
        title: 'Register Planter',
        href: createPage().url,
        icon: User,
    },
];

export default function Index({
    planters,
    productions,
    certifications,
    lands,
}: {
    planters: PlanterRow[];
    productions: ProductionRow[];
    certifications: CertificationRow[];
    lands: LandRow[];
}) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Planters">
                <title>Planters</title>
            </Head>
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

            <StatsContainer label="Planter Stats">
                <PlanterStats
                    planters={planters}
                    productions={productions}
                    certifications={certifications}
                    lands={lands}
                />
            </StatsContainer>

            <div className="container-full px-3 py-2">
                <DataTable
                    columns={planterColumns}
                    data={planters}
                    bulkDelete={planterBulkDelete}
                />
            </div>
        </AppLayout>
    );
}
