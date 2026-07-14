import AppLayout from '@/layouts/app-layout';
import React, { useMemo } from 'react';
import type { BreadcrumbItem } from '@/types';
import {
    Container,
    ContainerHeader,
    ContainerHeaderEnd,
} from '@/components/container';
import { Head } from '@inertiajs/react';
import { PayrollType } from './payroll-types';
import { createPayrollColumns } from './payroll-column-def';
import { DataTable } from '@/components/data-table/data-table';
import GeneratePayrollModal from './generate-payroll-modal';
import {
    bulkUpdate as payrollBulkUpdate,
    show as payrollShow,
} from '@/routes/payroll';
import { payrollBulkDelete } from '@/components/data-table/bulk-delete';
import { TableEditToolbar } from '@/components/data-table/table-edit-toolbar';
import { useTableEditMode } from '@/hooks/use-table-edit-mode';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Payroll Management',
        href: '#',
    },
];

const Index = ({ payrolls }: { payrolls: PayrollType[] }) => {
    const {
        isEditing,
        isSaving,
        startEditing,
        cancelEditing,
        saveEdits,
        handleCellChange,
    } = useTableEditMode({
        rows: payrolls,
        fields: ['status'],
        saveUrl: payrollBulkUpdate().url,
    });

    const payrollColumns = useMemo(
        () =>
            createPayrollColumns({
                isEditing,
                onCellChange: handleCellChange,
            }),
        [isEditing, handleCellChange],
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Payroll"></Head>

            <Container>
                <ContainerHeader>
                    Payroll Table
                    <ContainerHeaderEnd>
                        <TableEditToolbar
                            isEditing={isEditing}
                            isSaving={isSaving}
                            disabled={payrolls.length === 0}
                            onStart={startEditing}
                            onCancel={cancelEditing}
                            onSave={saveEdits}
                        />
                        <GeneratePayrollModal />
                    </ContainerHeaderEnd>
                </ContainerHeader>
                <DataTable
                    data={payrolls}
                    columns={payrollColumns}
                    onRowDoubleClick={
                        isEditing
                            ? undefined
                            : (row) => payrollShow(row.id).url
                    }
                    bulkDelete={isEditing ? undefined : payrollBulkDelete}
                />
            </Container>
        </AppLayout>
    );
};

export default Index;
