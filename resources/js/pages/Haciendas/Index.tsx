import { Head, Link } from '@inertiajs/react';
import { BookOpen, Import, LandPlot, ShieldCheck, User } from 'lucide-react';
import ActionContainer from '@/components/action-container';
import { haciendaBulkDelete } from '@/components/data-table/bulk-delete';
import { DataTable } from '@/components/data-table/data-table';
import { haciendaColumns } from '@/components/data-table/hacienda-columns';
import { HaciendaDialog } from '@/components/haciendas/haciendas-dialog';
import HaciendaStats from '@/components/haciendas/stat-cards/HaciendaStats';
import type {
    HaciendaRow,
    PlanterRow,
} from '@/components/planters/planters-table-types';
// import PlantersTabsTable from '@/components/planters/planters-tabs-table';
import StatsContainer from '@/components/stats-container';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { index as haciendasIndex } from '@/routes/haciendas';
import { show as haciendaShow } from '@/routes/haciendas';
import type { BreadcrumbItem } from '@/types';
import { Container, ContainerHeader } from '@/components/container';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Haciendas Management',
        href: haciendasIndex().url,
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
        title: 'Haciendas',
        value: 'haciendas',
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
    haciendas,
    planterNames,
    planters,
}: {
    haciendas: HaciendaRow[];
    planterNames: string[];
    planters: PlanterRow[];
}) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Haciendas"></Head>
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

                <HaciendaDialog
                    planterNames={planterNames}
                    planters={planters}
                />
            </ActionContainer>

            <StatsContainer
                className="flex-wrap bg-card"
                label="Hacienda Stats"
            >
                <HaciendaStats haciendas={haciendas} />
            </StatsContainer>

            <Container>
                <ContainerHeader>Hacienda Table</ContainerHeader>
                <DataTable
                    columns={haciendaColumns}
                    data={haciendas}
                    bulkDelete={haciendaBulkDelete}
                    onRowDoubleClick={(hacienda) =>
                        haciendaShow(hacienda.id).url
                    }
                />
            </Container>
        </AppLayout>
    );
}
