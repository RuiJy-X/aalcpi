import { Head } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { DataTable } from '@/components/data-table/data-table';
import { rawDataBulkDelete } from '@/components/data-table/bulk-delete';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import {
    Container,
    ContainerHeader,
    ContainerHeaderEnd,
} from '@/components/container';
import { Button } from '@/components/ui/button';
import { ImportDialog } from '@/components/import/import-dialog';
import { rawDataImportConfig } from '@/components/import/import-config';
import { RawDataRow } from '@/components/raw-data/raw-data-types';
import { rawDataColumns } from '@/components/raw-data/raw-data-columns';
import {
    create as rawDataCreate,
    index as rawDataIndex,
    show as rawDataShow,
} from '@/routes/RawData';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Raw Data Management',
        href: rawDataIndex.url(),
    },
];

export default function Index({ rawData }: { rawData: RawDataRow[] }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Raw Data"></Head>

            <Container>
                <ContainerHeader>
                    Raw Data Table
                    <ContainerHeaderEnd>
                        <ImportDialog config={rawDataImportConfig} />
                        <Button
                            variant="outline"
                            onClick={() => router.get(rawDataCreate.url())}
                        >
                            <Plus />
                            Add Raw Data
                        </Button>
                    </ContainerHeaderEnd>
                </ContainerHeader>
                <DataTable
                    columns={rawDataColumns}
                    data={rawData}
                    bulkDelete={rawDataBulkDelete}
                    onRowDoubleClick={(record) => rawDataShow(record.id).url}
                />
            </Container>
        </AppLayout>
    );
}
