import AppLayout from '@/layouts/app-layout';
import React, { useMemo, useState } from 'react';
import type { BreadcrumbItem } from '@/types';
import {
    Container,
    ContainerHeader,
    ContainerHeaderEnd,
} from '@/components/container';
import { Head, Link } from '@inertiajs/react';
import { PayrollType } from './payroll-types';
import { createPayrollColumns } from './payroll-column-def';
import { DataTable } from '@/components/data-table/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Calculator, FileText, Printer } from 'lucide-react';
import {
    bulkUpdate as payrollBulkUpdate,
    show as payrollShow,
    create as payrollCreate,
} from '@/routes/payroll';
import { payrollBulkDelete } from '@/components/data-table/bulk-delete';
import { TableEditToolbar } from '@/components/data-table/table-edit-toolbar';
import { useTableEditMode } from '@/hooks/use-table-edit-mode';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Payroll Management',
        href: '#',
    },
];

const Index = ({ payrolls }: { payrolls: PayrollType[] }) => {
    const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
    const [pdfStart, setPdfStart] = useState(() => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        return `${year}-${month}-01`;
    });
    const [pdfEnd, setPdfEnd] = useState(() => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
        return `${year}-${month}-${lastDay}`;
    });

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

    const handleStreamSummaryPdf = (e: React.FormEvent) => {
        e.preventDefault();
        window.open(`/Payroll/summary-pdf?period_start=${pdfStart}&period_end=${pdfEnd}`, '_blank');
        setIsPdfModalOpen(false);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Payroll Summary & Batch Processing" />

            <Container>
                <ContainerHeader>
                    <div>
                        <div className="flex items-center gap-2">
                            <Calculator className="h-6 w-6 text-primary" />
                            <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                Payroll Summary & Batch Processing
                            </h1>
                        </div>
                        <p className="text-sm font-normal text-muted-foreground mt-0.5">
                            Formal payroll register, statutory deductions, and period batch generation.
                        </p>
                    </div>
                    <ContainerHeaderEnd>
                        <div className="flex items-center gap-3">
                            <TableEditToolbar
                                isEditing={isEditing}
                                isSaving={isSaving}
                                disabled={payrolls.length === 0}
                                onStart={startEditing}
                                onCancel={cancelEditing}
                                onSave={saveEdits}
                            />
                            <Button
                                variant="outline"
                                onClick={() => setIsPdfModalOpen(true)}
                                className="font-semibold"
                            >
                                <Printer className="mr-2 h-4 w-4" />
                                Export Summary PDF
                            </Button>
                            <Button asChild disabled={isEditing} className="px-5 font-bold">
                                <Link href={payrollCreate().url}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Generate Payroll Batch
                                </Link>
                            </Button>
                        </div>
                    </ContainerHeaderEnd>
                </ContainerHeader>
                <div className="pt-2">
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
                </div>
            </Container>

            {/* Date Range Selection Modal for DomPDF Summary */}
            <Dialog open={isPdfModalOpen} onOpenChange={setIsPdfModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary" />
                            Export Printed Payroll Summary PDF
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleStreamSummaryPdf} className="space-y-4 pt-2">
                        <p className="text-xs text-muted-foreground">
                            Specify the pay period date range for the 16-column printed payroll summary sheet.
                        </p>

                        <div className="space-y-1.5">
                            <Label htmlFor="pdf_start" className="text-xs font-semibold">
                                Start Date *
                            </Label>
                            <Input
                                id="pdf_start"
                                type="date"
                                value={pdfStart}
                                onChange={(e) => setPdfStart(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="pdf_end" className="text-xs font-semibold">
                                End Date *
                            </Label>
                            <Input
                                id="pdf_end"
                                type="date"
                                value={pdfEnd}
                                onChange={(e) => setPdfEnd(e.target.value)}
                                required
                            />
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsPdfModalOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" className="font-bold">
                                <Printer className="mr-2 h-4 w-4" />
                                Generate PDF Summary
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
};

export default Index;
