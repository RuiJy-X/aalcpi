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
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Plus,
    Calculator,
    FileText,
    Printer,
    Calendar,
    RotateCcw,
    Filter,
    HandCoins,
    History,
} from 'lucide-react';
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
    // Status Filter Tab state
    const [activeTab, setActiveTab] = useState<
        'all' | 'draft' | 'pending' | 'paid'
    >('all');

    // Date Range Filter state
    const [filterStartDate, setFilterStartDate] = useState<string>('');
    const [filterEndDate, setFilterEndDate] = useState<string>('');

    // Advancements Modals
    const [isGrantAdvanceOpen, setIsGrantAdvanceOpen] = useState(false);
    const [isAdvancementLogsOpen, setIsAdvancementLogsOpen] = useState(false);

    // Export PDF Modal state
    const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
    const [pdfStatus, setPdfStatus] = useState<string>('all');
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

    // Counts for status tabs
    const counts = useMemo(() => {
        return {
            all: payrolls.length,
            draft: payrolls.filter((p) => p.status === 'draft').length,
            pending: payrolls.filter((p) => p.status === 'pending').length,
            paid: payrolls.filter((p) => p.status === 'paid').length,
        };
    }, [payrolls]);

    // Dynamic filtering by Status Tab + Date Range Filter Bar
    const filteredPayrolls = useMemo(() => {
        return payrolls.filter((p) => {
            // Status Tab Filter
            if (activeTab !== 'all' && p.status !== activeTab) {
                return false;
            }

            // Date Range Filter
            if (filterStartDate) {
                const pStart = p.period_start ? new Date(p.period_start) : null;
                const filterStart = new Date(filterStartDate);
                if (pStart && pStart < filterStart) {
                    return false;
                }
            }

            if (filterEndDate) {
                const pEnd = p.period_end ? new Date(p.period_end) : null;
                const filterEnd = new Date(filterEndDate);
                if (pEnd && pEnd > filterEnd) {
                    return false;
                }
            }

            return true;
        });
    }, [payrolls, activeTab, filterStartDate, filterEndDate]);

    const payrollColumns = useMemo(
        () =>
            createPayrollColumns({
                isEditing,
                onCellChange: handleCellChange,
            }),
        [isEditing, handleCellChange],
    );

    const handleClearDateFilter = () => {
        setFilterStartDate('');
        setFilterEndDate('');
    };

    const handleStreamSummaryPdf = (e: React.FormEvent) => {
        e.preventDefault();
        window.open(
            `/Payroll/summary-pdf?period_start=${pdfStart}&period_end=${pdfEnd}&status=${pdfStatus}`,
            '_blank',
        );
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
                        <p className="mt-0.5 text-sm font-normal text-muted-foreground">
                            Formal payroll register, statutory deductions, cash
                            advancements, and period batch generation.
                        </p>
                    </div>
                    <ContainerHeaderEnd>
                        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:gap-3">
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
                                className="text-xs font-semibold sm:text-sm"
                            >
                                <Printer className="mr-1.5 h-4 w-4" />
                                Export Summary PDF
                            </Button>
                            <Button
                                asChild
                                disabled={isEditing}
                                className="px-4 text-xs font-bold sm:text-sm"
                            >
                                <Link href={payrollCreate().url}>
                                    <Plus className="mr-1.5 h-4 w-4" />
                                    Generate Payroll Batch
                                </Link>
                            </Button>
                        </div>
                    </ContainerHeaderEnd>
                </ContainerHeader>

                {/* Date Filter & Status Navigation Bar */}
                <div className="space-y-4 pt-2">
                    {/* Status Tabs Navigation */}
                    <div className="flex flex-col gap-3 border-b border-border/60 pb-3 sm:flex-row sm:items-center sm:justify-between">
                        <Tabs
                            value={activeTab}
                            onValueChange={(val) => setActiveTab(val as any)}
                            className="w-full sm:w-auto"
                        >
                            <TabsList variant="line" className="h-10">
                                <TabsTrigger
                                    value="all"
                                    className="gap-2 text-xs font-semibold sm:text-sm"
                                >
                                    All Payrolls
                                    <Badge
                                        variant="secondary"
                                        className="py-0.2 px-1.5 text-xs"
                                    >
                                        {counts.all}
                                    </Badge>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="draft"
                                    className="gap-2 text-xs font-semibold sm:text-sm"
                                >
                                    Draft
                                    <Badge
                                        variant="outline"
                                        className="py-0.2 border-amber-300 bg-amber-50 px-1.5 text-xs text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                                    >
                                        {counts.draft}
                                    </Badge>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="pending"
                                    className="gap-2 text-xs font-semibold sm:text-sm"
                                >
                                    Pending
                                    <Badge
                                        variant="outline"
                                        className="py-0.2 border-blue-300 bg-blue-50 px-1.5 text-xs text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                                    >
                                        {counts.pending}
                                    </Badge>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="paid"
                                    className="gap-2 text-xs font-semibold sm:text-sm"
                                >
                                    Paid
                                    <Badge
                                        variant="outline"
                                        className="py-0.2 border-emerald-300 bg-emerald-50 px-1.5 text-xs text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                                    >
                                        {counts.paid}
                                    </Badge>
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>

                        {/* Date Filter Bar */}
                        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-2 shadow-xs">
                            <div className="flex items-center gap-1.5 px-1 text-xs font-bold tracking-wider text-muted-foreground uppercase">
                                <Filter className="h-3.5 w-3.5 text-primary" />
                                Date Filter:
                            </div>
                            <div className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                <Input
                                    type="date"
                                    value={filterStartDate}
                                    onChange={(e) =>
                                        setFilterStartDate(e.target.value)
                                    }
                                    className="h-8 w-[130px] text-xs"
                                    placeholder="Start Date"
                                />
                            </div>
                            <span className="text-xs font-semibold text-muted-foreground">
                                —
                            </span>
                            <div className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                <Input
                                    type="date"
                                    value={filterEndDate}
                                    onChange={(e) =>
                                        setFilterEndDate(e.target.value)
                                    }
                                    className="h-8 w-[130px] text-xs"
                                    placeholder="End Date"
                                />
                            </div>

                            {(filterStartDate || filterEndDate) && (
                                <Button
                                    variant="ghost"
                                    size="xs"
                                    onClick={handleClearDateFilter}
                                    className="h-8 text-xs text-muted-foreground hover:text-foreground"
                                >
                                    <RotateCcw className="mr-1 h-3 w-3" />
                                    Clear
                                </Button>
                            )}
                        </div>
                    </div>

                    <DataTable
                        data={filteredPayrolls}
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
                        <DialogTitle className="flex items-center gap-2 text-base font-bold">
                            <FileText className="h-5 w-5 text-primary" />
                            Export Printed Payroll Summary PDF
                        </DialogTitle>
                    </DialogHeader>

                    <form
                        onSubmit={handleStreamSummaryPdf}
                        className="space-y-4 pt-2"
                    >
                        <p className="text-xs text-muted-foreground">
                            Specify the pay period date range for the 18-column
                            printed payroll summary sheet.
                        </p>

                        <div className="space-y-1.5">
                            <Label
                                htmlFor="pdf_status"
                                className="text-xs font-semibold"
                            >
                                Filter by Status *
                            </Label>
                            <Select
                                value={pdfStatus}
                                onValueChange={setPdfStatus}
                            >
                                <SelectTrigger
                                    id="pdf_status"
                                    className="h-9 text-xs"
                                >
                                    <SelectValue placeholder="Select Status Filter..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        All Statuses (Draft, Pending, Paid)
                                    </SelectItem>
                                    <SelectItem value="draft">
                                        Draft Only
                                    </SelectItem>
                                    <SelectItem value="pending">
                                        Pending Only
                                    </SelectItem>
                                    <SelectItem value="paid">
                                        Paid Only
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="pdf_start"
                                    className="text-xs font-semibold"
                                >
                                    Start Date *
                                </Label>
                                <Input
                                    id="pdf_start"
                                    type="date"
                                    value={pdfStart}
                                    onChange={(e) =>
                                        setPdfStart(e.target.value)
                                    }
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="pdf_end"
                                    className="text-xs font-semibold"
                                >
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
