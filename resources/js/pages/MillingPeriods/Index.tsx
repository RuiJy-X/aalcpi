import { Head } from '@inertiajs/react';
import { DataTable } from '@/components/data-table/data-table';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import {
    Container,
    ContainerHeader,
    ContainerHeaderEnd,
} from '@/components/container';
import { millingPeriodColumns } from '@/components/milling-periods/milling-periods-columns';
import type { MillingPeriodRow } from '@/components/milling-periods/milling-periods-types';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { create as millingPeriodCreate } from '@/routes/MillingPeriods';
import { router } from '@inertiajs/react';
import { show as millingPeriodShow } from '@/routes/MillingPeriods';
import { millingPeriodBulkDelete } from '@/components/data-table/bulk-delete';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Milling Periods Management',
        href: '#',
    },
];

export default function Index({
    milling_periods,
}: {
    milling_periods: MillingPeriodRow[];
}) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Milling Periods"></Head>

            <Container>
                <ContainerHeader>
                    Milling Periods Table
                    <ContainerHeaderEnd>
                        <Button
                            onClick={() =>
                                router.get(millingPeriodCreate().url)
                            }
                        >
                            <Plus />
                            Add
                        </Button>
                    </ContainerHeaderEnd>
                </ContainerHeader>
                <DataTable
                    onRowDoubleClick={(milling_period) =>
                        millingPeriodShow(milling_period.id).url
                    }
                    bulkDelete={millingPeriodBulkDelete}
                    data={milling_periods}
                    columns={millingPeriodColumns}
                ></DataTable>
            </Container>
        </AppLayout>
    );
}
