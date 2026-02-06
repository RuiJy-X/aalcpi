import { Head, Link, useForm } from '@inertiajs/react';
import { BookOpen, Clipboard, User } from 'lucide-react';
import PlantersTabsTable from '@/components/planters/planters-tabs-table';
import StatCard from '@/components/stat-card';
import StatsContainer from '@/components/stats-container';
import AppLayout from '@/layouts/app-layout';
import { index as planterIndex, create, store } from '@/routes/planters';
import type { BreadcrumbItem } from '@/types';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import BasicDetails from '@/components/planters/basic-details';
import HaciendaDetails from '@/components/planters/hacienda-details';
import { email } from '@/routes/password';
import { PlanterFormProvider } from '@/components/planters/planter-forms';
import React from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Planter Management',
        href: planterIndex.url(),
    },
    {
        title: 'Register Planter',
        href: create.url(),
    },
];

export default function Create() {
    const form = useForm({
        // Basic Details
        name: '',
        address: '',
        email: '',
        phone: '',
        // hacienda details
        haciendaName: '',
        location: '',
        status: '',
        ownershipType: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(store.url());
    };

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

                <PlanterFormProvider value={form}>
                    <form onSubmit={handleSubmit} className="mx-5 w-1/2">
                        <BasicDetails />
                        <HaciendaDetails />
                        <div className="mt-2 flex justify-end gap-2">
                            <Link>
                                <Button type="button" variant="outline">
                                    Cancel
                                </Button>
                            </Link>
                            <Button type="submit">Register</Button>
                        </div>
                    </form>
                </PlanterFormProvider>
            </div>
        </AppLayout>
    );
}
