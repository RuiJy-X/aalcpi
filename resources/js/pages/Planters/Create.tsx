import { Head, Link, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import Heading from '@/components/heading';
import BasicDetails from '@/components/planters/basic-details';
import HaciendaDetails from '@/components/planters/hacienda-details';
import { PlanterFormProvider } from '@/components/planters/planter-forms';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { index as planterIndex, create, store } from '@/routes/planters';
import type { BreadcrumbItem } from '@/types';

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
        tin_number: '',
        phone: '',
        // hacienda details
        haciendaName: '',
        location: '',
        status: '',
        ownershipType: '',
    });

    const handleSubmit = (e: FormEvent) => {
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
