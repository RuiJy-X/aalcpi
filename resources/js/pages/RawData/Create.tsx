import { Head, router, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { Container, ContainerHeader } from '@/components/container';
import RawDataForm from '@/components/raw-data/raw-data-form';
import type { RawDataFormData } from '@/components/raw-data/raw-data-types';
import AppLayout from '@/layouts/app-layout';
import {
    create as rawDataCreate,
    index as rawDataIndex,
    store as rawDataStore,
} from '@/routes/RawData';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Raw Data Management',
        href: rawDataIndex.url(),
    },
    {
        title: 'Create Raw Data',
        href: rawDataCreate.url(),
    },
];

const defaultValues: RawDataFormData = {
    crop_year: '',
    date: new Date().toISOString().split('T')[0],
    planter_code: '',
    gross_cw: '',
    net_cw: '',
    trucks: '',
    theoretical_lkg: '',
    actual_lkg: '',
    calculated_sugar: '',
    trash: '',
    Lkg_per_TC: '',
};

export default function Create() {
    const { data, setData, errors, processing, post } =
        useForm<RawDataFormData>(defaultValues);

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        post(rawDataStore.url());
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Raw Data" />

            <Container>
                <ContainerHeader>Create Raw Data Record</ContainerHeader>
                <RawDataForm
                    data={data}
                    setData={setData}
                    errors={errors}
                    processing={processing}
                    submitLabel="Create Record"
                    onSubmit={handleSubmit}
                    onCancel={() => router.get(rawDataIndex.url())}
                />
            </Container>
        </AppLayout>
    );
}
