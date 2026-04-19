import { Head, router, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { Container, ContainerHeader } from '@/components/container';
import RawDataForm from '@/components/raw-data/raw-data-form';
import type {
    RawDataFormData,
    RawDataRow,
} from '@/components/raw-data/raw-data-types';
import AppLayout from '@/layouts/app-layout';
import {
    index as rawDataIndex,
    show as rawDataShow,
    update as rawDataUpdate,
} from '@/routes/RawData';
import type { BreadcrumbItem } from '@/types';

export default function View({ rawData }: { rawData: RawDataRow }) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Raw Data Management',
            href: rawDataIndex.url(),
        },
        {
            title: `Raw Data #${rawData.id}`,
            href: rawDataShow(rawData.id).url,
        },
    ];

    const { data, setData, errors, processing, patch } = useForm<RawDataFormData>(
        {
            crop_year: String(rawData.crop_year ?? ''),
            date: String(rawData.date ?? ''),
            planter_code: String(rawData.planter_code ?? ''),
            gross_cw: String(rawData.gross_cw ?? ''),
            net_cw: String(rawData.net_cw ?? ''),
            trucks: String(rawData.trucks ?? ''),
            theoretical_lkg: String(rawData.theoretical_lkg ?? ''),
            actual_lkg: String(rawData.actual_lkg ?? ''),
            calculated_sugar: String(rawData.calculated_sugar ?? ''),
            trash: String(rawData.trash ?? ''),
            Lkg_per_TC: String(rawData.Lkg_per_TC ?? ''),
        },
    );

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        patch(rawDataUpdate(rawData.id).url);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="View Raw Data" />

            <Container>
                <ContainerHeader>Raw Data Record #{rawData.id}</ContainerHeader>
                <RawDataForm
                    data={data}
                    setData={setData}
                    errors={errors}
                    processing={processing}
                    submitLabel="Update Record"
                    onSubmit={handleSubmit}
                    onCancel={() => router.get(rawDataIndex.url())}
                />
            </Container>
        </AppLayout>
    );
}
