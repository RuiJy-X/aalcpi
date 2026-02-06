import { Head, Link } from '@inertiajs/react';
import { BookOpen, Clipboard, User } from 'lucide-react';
import PlantersTabsTable from '@/components/planters/planters-tabs-table';
import StatCard from '@/components/stat-card';
import StatsContainer from '@/components/stats-container';
import AppLayout from '@/layouts/app-layout';
import { create } from '@/routes/planters';
import type { BreadcrumbItem } from '@/types';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import BasicDetails from '@/components/planters/basic-details';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Register Planter',
        href: create.url(),
    },
];

export default function Create() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Products">
                <title>Planters</title>
            </Head>
            <div className="px-4 py-6">
                <Heading
                    title="Register a new planter"
                    description="Fill up their basic details and hacienda details"
                />
                <BasicDetails />
            </div>
        </AppLayout>
    );
}
