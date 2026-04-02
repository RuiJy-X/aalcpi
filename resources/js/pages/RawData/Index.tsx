import { Head } from '@inertiajs/react';
import { DataTable } from '@/components/data-table/data-table';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import {
    Container,
    ContainerHeader,
    ContainerHeaderEnd,
} from '@/components/container';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { router } from '@inertiajs/react';
import { RawDataRow } from '@/components/raw-data/raw-data-types';
import { rawDataColumns } from '@/components/raw-data/raw-data-columns';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Raw Data Management',
        href: '#',
    },
];

export default function Index({rawData}: {
    rawData: RawDataRow[];
}) {

    console.log(rawData)
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Raw Data"></Head>

            <Container>
                <ContainerHeader>
                    Raw Data Table
                    <ContainerHeaderEnd>
                        {/* import here */}
                    </ContainerHeaderEnd>
                </ContainerHeader>
                <DataTable
                    columns={rawDataColumns}
                    data={rawData}
                    />
              
            </Container>

        </AppLayout>
    );
}
