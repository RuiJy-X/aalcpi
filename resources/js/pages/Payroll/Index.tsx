import AppLayout from '@/layouts/app-layout';
import React from 'react';
import type { BreadcrumbItem } from '@/types';
import {
    Container,
    ContainerHeader,
    ContainerHeaderEnd,
} from '@/components/container';
import { Head } from '@inertiajs/react';
import { PayrollType } from './payroll-types';
import { payrollColumns } from './payroll-column-def';
import { DataTable } from '@/components/data-table/data-table';
import GeneratePayrollModal from './generate-payroll-modal';
import { show as payrollShow } from '@/routes/payroll';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Payroll Management',
        href: '#',
    },
];

const Index = ({ payrolls }: { payrolls: PayrollType[] }) => {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Payroll"></Head>

            <Container>
                <ContainerHeader>
                    Payroll Table
                    <ContainerHeaderEnd>
                        <GeneratePayrollModal />
                    </ContainerHeaderEnd>
                </ContainerHeader>
                <DataTable
                    data={payrolls}
                    columns={payrollColumns}
                    onRowDoubleClick={(row) => payrollShow(row.id).url}
                />
            </Container>
        </AppLayout>
    );
};

export default Index;
