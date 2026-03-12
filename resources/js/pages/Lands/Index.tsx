import { Head, Link } from '@inertiajs/react';
import { BookOpen, Import, LandPlot, ShieldCheck, User } from 'lucide-react';
import ActionContainer from '@/components/action-container';
import { landBulkDelete } from '@/components/data-table/bulk-delete';
import { DataTable } from '@/components/data-table/data-table';
import { landColumns } from '@/components/data-table/land-columns';
import { LandDialog } from '@/components/lands/land-dialog';
import LandStats from '@/components/lands/stat-cards/LandStats';
import type {
    LandRow,
    PlanterRow,
} from '@/components/planters/planters-table-types';
// import PlantersTabsTable from '@/components/planters/planters-tabs-table';
import StatsContainer from '@/components/stats-container';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { index as landsIndex } from '@/routes/lands';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Lands Management',
        href: landsIndex().url,
    },
];

const tabs = [
    {
        title: 'Planters',
        value: 'planters',
        icon: User,
    },
    {
        title: 'Productions',
        value: 'productions',
        icon: BookOpen,
    },
    {
        title: 'Certifications',
        value: 'certifications',
        icon: ShieldCheck,
    },
    {
        title: 'Lands',
        value: 'lands',
        icon: LandPlot,
    },
];

const actions = [
    {
        title: 'Import Data',
        href: '#',
        icon: Import,
    },
];

export default function Index({
    lands,
    planterNames,
    planters,
}: {
    lands: LandRow[];
    planterNames: string[];
    planters: PlanterRow[];
}) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Lands"></Head>
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

                <LandDialog planterNames={planterNames} planters={planters} />
            </ActionContainer>

            <StatsContainer className="flex-wrap bg-card" label="Land Stats">
                <LandStats lands={lands} />
            </StatsContainer>

            <div className="container-full px-3 py-2">
                <DataTable
                    columns={landColumns}
                    data={lands}
                    bulkDelete={landBulkDelete}
                />
            </div>
        </AppLayout>
    );
}
