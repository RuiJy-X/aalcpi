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
import { index as userIndex } from '@/routes/users';
import type { BreadcrumbItem } from '@/types';
import Container from '@/components/container';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'User Management',
        href: userIndex().url,
    },
];

export default function Index() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Users"></Head>

            <Container>
                <h1 className="font-semibold">Create a new User</h1>
            </Container>
        </AppLayout>
    );
}
