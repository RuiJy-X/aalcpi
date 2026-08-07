import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import axios from 'axios';
import {
    Calendar,
    Upload,
    CheckCircle2,
    AlertTriangle,
    ArrowLeft,
    Play,
    Edit3,
    UploadCloud,
    Wallet,
    FileSpreadsheet,
    RefreshCw,
    X,
    Printer,
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import {
    index as payrollIndex,
    create as payrollCreate,
} from '@/routes/payroll';
import type { BreadcrumbItem } from '@/types';
import {
    Container,
    ContainerHeader,
    ContainerHeaderEnd,
} from '@/components/container';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';

interface AuditedEmployee {
    employee_id: number;
    employee_code: string;
    name: string;
    position: string;
    daily_rate: number;
    base_salary: number;
    hourly_rate: number;
    days_worked: number;
    hours_worked: number;
    gross_earnings: number;
    overtime_pay: number;
    total_earnings: number;
    sss_loan: number;
    pagibig_loan: number;
    emergency_loan: number;
    pagibig_contribution: number;
    sss_contribution: number;
    philhealth_contribution: number;
    withholding_tax: number;
    total_deductions: number;
    net_amount: number;
    reasons: string[];
}

interface BatchData {
    period_start: string;
    period_end: string;
    ready: AuditedEmployee[];
    action_required: AuditedEmployee[];
    totals: {
        total_gross: number;
        total_deductions: number;
        total_net: number;
        ready_count: number;
        action_required_count: number;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Payroll Management', href: payrollIndex().url },
    { title: 'Batch Generation Hub', href: payrollCreate().url },
];

function formatCurrency(val?: number | null, isDeduction: boolean = false) {
    const num = val ?? 0;
    const formatted = new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
    }).format(num);
    return isDeduction && num > 0 ? `-${formatted}` : formatted;
}

export default function GenerateBatchPage({
    initialBatchData,
}: {
    initialBatchData: BatchData;
}) {
    const [batchData, setBatchData] = useState<BatchData>(initialBatchData);
    const [periodStart, setPeriodStart] = useState<string>(
        initialBatchData.period_start,
    );
    const [periodEnd, setPeriodEnd] = useState<string>(
        initialBatchData.period_end,
    );

    const [isLoadingAudit, setIsLoadingAudit] = useState(false);
    const [isUploadingAttendance, setIsUploadingAttendance] = useState(false);
    const [isProcessingBatch, setIsProcessingBatch] = useState(false);

    // Quick profile fix drawer/modal state
    const [activeEditEmployee, setActiveEditEmployee] =
        useState<AuditedEmployee | null>(null);
    const [editForm, setEditForm] = useState({
        daily_rate: '',
        sss_loan: '',
        pagibig_loan: '',
        emergency_loan: '',
        pagibig_contribution: '',
        sss_contribution: '',
        philhealth_contribution: '',
        withholding_tax: '',
    });
    const [isSavingQuickSetup, setIsSavingQuickSetup] = useState(false);

    // Date range preset handlers
    const applyPreset = (type: 'first_cutoff' | 'second_cutoff') => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');

        let start = '';
        let end = '';

        if (type === 'first_cutoff') {
            start = `${year}-${month}-01`;
            end = `${year}-${month}-15`;
        } else {
            const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
            start = `${year}-${month}-16`;
            end = `${year}-${month}-${lastDay}`;
        }

        setPeriodStart(start);
        setPeriodEnd(end);
        fetchAuditPreview(start, end);
    };

    // Fetch pre-payroll audit preview
    const fetchAuditPreview = async (startStr: string, endStr: string) => {
        setIsLoadingAudit(true);
        try {
            const res = await axios.post('/Payroll/preview-batch', {
                period_start: startStr,
                period_end: endStr,
            });
            setBatchData(res.data);
        } catch (err) {
            console.error('Audit preview error:', err);
        } finally {
            setIsLoadingAudit(false);
        }
    };

    // Handle batch attendance upload
    const handleBatchAttendanceUpload = async (
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('attendance_file', file);
        formData.append('period_start', periodStart);
        formData.append('period_end', periodEnd);

        setIsUploadingAttendance(true);
        try {
            const res = await axios.post(
                '/Payroll/upload-attendance-batch',
                formData,
                {
                    headers: { 'Content-Type': 'multipart/form-data' },
                },
            );
            if (res.data.success) {
                setBatchData(res.data.batchData);
                alert('Attendance Excel file imported successfully!');
            }
        } catch (err: any) {
            alert(
                err.response?.data?.message ||
                    'Failed to import attendance file.',
            );
        } finally {
            setIsUploadingAttendance(false);
            e.target.value = '';
        }
    };

    // Open Quick Fix Setup Modal
    const openQuickFix = (emp: AuditedEmployee) => {
        setActiveEditEmployee(emp);
        setEditForm({
            daily_rate: String(emp.daily_rate || '550.00'),
            sss_loan: String(emp.sss_loan || '0.00'),
            pagibig_loan: String(emp.pagibig_loan || '0.00'),
            emergency_loan: String(emp.emergency_loan || '0.00'),
            pagibig_contribution: String(emp.pagibig_contribution || '200.00'),
            sss_contribution: String(emp.sss_contribution || '0.00'),
            philhealth_contribution: String(
                emp.philhealth_contribution || '0.00',
            ),
            withholding_tax: String(emp.withholding_tax || '0.00'),
        });
    };

    // Save Quick Fix Setup
    const handleSaveQuickFix = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeEditEmployee) return;

        setIsSavingQuickSetup(true);
        try {
            const res = await axios.post(
                `/Payroll/quick-update-employee/${activeEditEmployee.employee_id}`,
                {
                    ...editForm,
                    period_start: periodStart,
                    period_end: periodEnd,
                },
            );

            if (res.data.success) {
                setBatchData(res.data.batchData);
                setActiveEditEmployee(null);
            }
        } catch (err: any) {
            alert(
                err.response?.data?.message || 'Error updating profile setup.',
            );
        } finally {
            setIsSavingQuickSetup(false);
        }
    };

    // Process Payroll Batch
    const handleProcessBatch = () => {
        if (batchData.ready.length === 0) {
            alert(
                'No ready employees available to process for this date range.',
            );
            return;
        }

        if (
            !confirm(
                `Are you sure you want to process and generate payroll records for ${batchData.ready.length} ready employees?`,
            )
        ) {
            return;
        }

        setIsProcessingBatch(true);
        router.post(
            '/Payroll/process-batch',
            {
                period_start: periodStart,
                period_end: periodEnd,
            },
            {
                onFinish: () => setIsProcessingBatch(false),
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Payroll Batch Generation & Pre-Audit Hub" />

            <Container>
                <ContainerHeader>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            Payroll Batch Generation & Pre-Audit Hub
                        </h1>
                        <p className="mt-0.5 text-sm font-normal text-muted-foreground">
                            Set pay period dates, review pre-payroll audit
                            results, and resolve missing attendance or profile
                            setups directly on this page.
                        </p>
                    </div>
                    <ContainerHeaderEnd>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                            <Button variant="outline" asChild>
                                <Link href={payrollIndex().url}>
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back to Payroll List
                                </Link>
                            </Button>

                            <Button
                                variant="outline"
                                onClick={() =>
                                    window.open(
                                        `/Payroll/summary-pdf?period_start=${periodStart}&period_end=${periodEnd}`,
                                        '_blank',
                                    )
                                }
                                className="font-semibold"
                            >
                                <Printer className="mr-2 h-4 w-4" />
                                Export Summary PDF
                            </Button>

                            <Button
                                onClick={handleProcessBatch}
                                disabled={
                                    isProcessingBatch ||
                                    batchData.ready.length === 0
                                }
                                className="px-6 font-bold"
                            >
                                <Play className="mr-2 h-4 w-4 fill-current" />
                                {isProcessingBatch
                                    ? 'Processing Batch...'
                                    : `Process Batch (${batchData.ready.length})`}
                            </Button>
                        </div>
                    </ContainerHeaderEnd>
                </ContainerHeader>

                {/* Date Range Selection Bar & Presets */}
                <div className="my-4 space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-primary" />
                            <h2 className="text-base font-bold text-foreground">
                                Pay Period Date Range Selection
                            </h2>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="mr-1 text-xs font-semibold text-muted-foreground">
                                Quick Cutoffs:
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => applyPreset('first_cutoff')}
                            >
                                1st Cutoff (1st - 15th)
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => applyPreset('second_cutoff')}
                            >
                                2nd Cutoff (16th - End)
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 items-end gap-4 pt-2 sm:grid-cols-3">
                        <div className="space-y-1.5">
                            <Label
                                htmlFor="period_start"
                                className="text-xs font-semibold text-muted-foreground uppercase"
                            >
                                Period Start Date *
                            </Label>
                            <Input
                                id="period_start"
                                type="date"
                                value={periodStart}
                                onChange={(e) => {
                                    setPeriodStart(e.target.value);
                                    if (
                                        periodEnd &&
                                        e.target.value <= periodEnd
                                    ) {
                                        fetchAuditPreview(
                                            e.target.value,
                                            periodEnd,
                                        );
                                    }
                                }}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label
                                htmlFor="period_end"
                                className="text-xs font-semibold text-muted-foreground uppercase"
                            >
                                Period End Date *
                            </Label>
                            <Input
                                id="period_end"
                                type="date"
                                value={periodEnd}
                                onChange={(e) => {
                                    setPeriodEnd(e.target.value);
                                    if (
                                        periodStart &&
                                        e.target.value >= periodStart
                                    ) {
                                        fetchAuditPreview(
                                            periodStart,
                                            e.target.value,
                                        );
                                    }
                                }}
                            />
                        </div>

                        <div>
                            <Button
                                variant="secondary"
                                className="w-full"
                                onClick={() =>
                                    fetchAuditPreview(periodStart, periodEnd)
                                }
                                disabled={isLoadingAudit}
                            >
                                {isLoadingAudit ? (
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                )}
                                Refresh Pre-Audit
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Pre-Payroll Audit Stat Summary Banner */}
                <div className="my-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
                    <div className="space-y-1 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
                        <p className="text-xs font-bold text-emerald-700 uppercase dark:text-emerald-400">
                            Ready for Payroll
                        </p>
                        <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
                            {batchData.totals.ready_count}{' '}
                            <span className="text-sm font-normal text-emerald-600">
                                Employees
                            </span>
                        </p>
                    </div>

                    <div className="space-y-1 rounded-xl border border-rose-500/30 bg-rose-500/5 p-4">
                        <p className="text-xs font-bold text-rose-700 uppercase dark:text-rose-400">
                            Action Required / Ineligible
                        </p>
                        <p className="text-2xl font-black text-rose-700 dark:text-rose-300">
                            {batchData.totals.action_required_count}{' '}
                            <span className="text-sm font-normal text-rose-600">
                                Employees
                            </span>
                        </p>
                    </div>

                    <div className="space-y-1 rounded-xl border border-border bg-card p-4">
                        <p className="text-xs font-semibold text-muted-foreground uppercase">
                            Est. Batch Gross Income
                        </p>
                        <p className="text-2xl font-bold text-foreground">
                            {formatCurrency(batchData.totals.total_gross)}
                        </p>
                    </div>

                    <div className="space-y-1 rounded-xl border border-primary/30 bg-primary/5 p-4">
                        <p className="text-xs font-bold text-primary uppercase">
                            Est. Total Net Payout
                        </p>
                        <p className="text-2xl font-extrabold text-primary">
                            {formatCurrency(batchData.totals.total_net)}
                        </p>
                    </div>
                </div>

                {/* Pre-Audit Employee Categorization Tabs */}
                <Tabs defaultValue="ready" className="w-full space-y-6">
                    <TabsList className="grid max-w-md grid-cols-2">
                        <TabsTrigger value="ready" className="gap-2 font-bold">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            Ready for Processing
                            <Badge variant="secondary" className="ml-1">
                                {batchData.totals.ready_count}
                            </Badge>
                        </TabsTrigger>
                        <TabsTrigger
                            value="action_required"
                            className="gap-2 font-bold"
                        >
                            <AlertTriangle className="h-4 w-4 text-rose-600" />
                            Action Required
                            <Badge variant="destructive" className="ml-1">
                                {batchData.totals.action_required_count}
                            </Badge>
                        </TabsTrigger>
                    </TabsList>

                    {/* TAB 1: READY LIST */}
                    <TabsContent value="ready">
                        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                            <div className="flex items-center justify-between border-b border-border bg-muted/30 p-4">
                                <h3 className="text-sm font-bold tracking-wider text-foreground uppercase">
                                    Audited & Verified Employees (
                                    {batchData.ready.length})
                                </h3>
                                <span className="text-xs text-muted-foreground">
                                    All attendance & profile rates verified for{' '}
                                    {periodStart} to {periodEnd}
                                </span>
                            </div>

                            {batchData.ready.length === 0 ? (
                                <div className="space-y-2 p-8 text-center">
                                    <AlertTriangle className="mx-auto h-10 w-10 text-amber-500" />
                                    <p className="text-base font-semibold text-foreground">
                                        No Employees Ready Yet
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Import attendance or complete profile
                                        setups for ineligible employees in the
                                        "Action Required" tab.
                                    </p>
                                </div>
                            ) : (
                                <div className="custom-scrollbar overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead className="border-b border-border bg-muted/50 font-semibold tracking-wider text-muted-foreground uppercase">
                                            <tr>
                                                <th className="px-4 py-3">
                                                    Code
                                                </th>
                                                <th className="px-4 py-3">
                                                    Employee Name
                                                </th>
                                                <th className="px-4 py-3">
                                                    Designation
                                                </th>
                                                <th className="px-4 py-3 text-right">
                                                    Daily Rate
                                                </th>
                                                <th className="px-4 py-3 text-center">
                                                    Days Worked
                                                </th>
                                                <th className="px-4 py-3 text-right">
                                                    Gross Earnings
                                                </th>
                                                <th className="px-4 py-3 text-right">
                                                    SSS Loan
                                                </th>
                                                <th className="px-4 py-3 text-right">
                                                    Pag-IBIG Loan
                                                </th>
                                                <th className="px-4 py-3 text-right">
                                                    Emergency Loan
                                                </th>
                                                <th className="px-4 py-3 text-right">
                                                    Total Deductions
                                                </th>
                                                <th className="px-4 py-3 text-right">
                                                    Net Pay
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/60 font-medium">
                                            {batchData.ready.map((emp) => (
                                                <tr
                                                    key={emp.employee_id}
                                                    className="transition-colors hover:bg-muted/40"
                                                >
                                                    <td className="px-4 py-3 font-mono">
                                                        {emp.employee_code}
                                                    </td>
                                                    <td className="px-4 py-3 font-bold text-foreground">
                                                        {emp.name}
                                                    </td>
                                                    <td className="px-4 py-3 text-muted-foreground">
                                                        {emp.position}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-semibold text-emerald-700 dark:text-emerald-400">
                                                        {formatCurrency(
                                                            emp.daily_rate,
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <Badge variant="outline">
                                                            {emp.days_worked}{' '}
                                                            days
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-bold text-foreground">
                                                        {formatCurrency(
                                                            emp.gross_earnings,
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-rose-600 dark:text-rose-400">
                                                        {formatCurrency(
                                                            emp.sss_loan,
                                                            true,
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-rose-600 dark:text-rose-400">
                                                        {formatCurrency(
                                                            emp.pagibig_loan,
                                                            true,
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-rose-600 dark:text-rose-400">
                                                        {formatCurrency(
                                                            emp.emergency_loan,
                                                            true,
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-semibold text-rose-600 dark:text-rose-400">
                                                        {formatCurrency(
                                                            emp.total_deductions,
                                                            true,
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-sm font-extrabold text-emerald-700 dark:text-emerald-300">
                                                        {formatCurrency(
                                                            emp.net_amount,
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    {/* TAB 2: ACTION REQUIRED LIST */}
                    <TabsContent value="action_required">
                        <div className="overflow-hidden rounded-xl border border-rose-500/30 bg-card shadow-sm">
                            <div className="flex items-center justify-between border-b border-border bg-rose-500/5 p-4">
                                <div>
                                    <h3 className="text-sm font-bold tracking-wider text-rose-700 uppercase dark:text-rose-400">
                                        Ineligible Employees - In-Page
                                        Resolution Hub (
                                        {batchData.action_required.length})
                                    </h3>
                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                        Resolve missing attendance or profile
                                        setups directly below. Once fixed,
                                        employees instantly move to Ready
                                        status!
                                    </p>
                                </div>
                            </div>

                            {batchData.action_required.length === 0 ? (
                                <div className="space-y-2 p-8 text-center">
                                    <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
                                    <p className="text-base font-semibold text-foreground">
                                        All Employees Are Ready!
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        No action required. You can process the
                                        payroll batch now.
                                    </p>
                                </div>
                            ) : (
                                <div className="divide-y divide-border/60">
                                    {batchData.action_required.map((emp) => (
                                        <div
                                            key={emp.employee_id}
                                            className="flex flex-col justify-between gap-4 p-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center"
                                        >
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-foreground">
                                                        {emp.name}
                                                    </span>
                                                    <Badge
                                                        variant="outline"
                                                        className="font-mono text-xs"
                                                    >
                                                        {emp.employee_code}
                                                    </Badge>
                                                    <span className="text-xs text-muted-foreground">
                                                        ({emp.position})
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap gap-2 pt-1">
                                                    {emp.reasons.map(
                                                        (reason, idx) => (
                                                            <Badge
                                                                key={idx}
                                                                variant="destructive"
                                                                className="text-xs font-normal"
                                                            >
                                                                ⚠️ {reason}
                                                            </Badge>
                                                        ),
                                                    )}
                                                </div>
                                            </div>

                                            {/* In-Page Action Resolution Buttons */}
                                            <div className="flex shrink-0 items-center gap-3">
                                                {/* Inline Attendance Upload */}
                                                <label className="cursor-pointer">
                                                    <span className="inline-flex h-9 items-center justify-center rounded-md border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm hover:bg-muted">
                                                        <Upload className="mr-1.5 h-3.5 w-3.5 text-primary" />
                                                        Upload Attendance
                                                    </span>
                                                    <input
                                                        type="file"
                                                        accept=".xlsx,.xls,.csv"
                                                        className="hidden"
                                                        onChange={
                                                            handleBatchAttendanceUpload
                                                        }
                                                        disabled={
                                                            isUploadingAttendance
                                                        }
                                                    />
                                                </label>

                                                {/* Quick Fix Setup Drawer Trigger */}
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() =>
                                                        openQuickFix(emp)
                                                    }
                                                >
                                                    <Edit3 className="mr-1.5 h-3.5 w-3.5" />
                                                    Quick Fix Setup
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </Container>

            {/* Quick Fix Profile Setup Modal / Drawer */}
            <Dialog
                open={!!activeEditEmployee}
                onOpenChange={(open) => !open && setActiveEditEmployee(null)}
            >
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold">
                            Quick Setup Fix: {activeEditEmployee?.name}
                        </DialogTitle>
                    </DialogHeader>

                    <form
                        onSubmit={handleSaveQuickFix}
                        className="space-y-4 pt-2"
                    >
                        <div className="space-y-1.5">
                            <Label
                                htmlFor="quick_daily_rate"
                                className="font-bold text-primary"
                            >
                                Daily Rate (₱) *
                            </Label>
                            <Input
                                id="quick_daily_rate"
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="550.00"
                                value={editForm.daily_rate}
                                onChange={(e) =>
                                    setEditForm({
                                        ...editForm,
                                        daily_rate: e.target.value,
                                    })
                                }
                                required
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="quick_sss_loan"
                                    className="text-xs font-semibold"
                                >
                                    SSS Loan (₱)
                                </Label>
                                <Input
                                    id="quick_sss_loan"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={editForm.sss_loan}
                                    onChange={(e) =>
                                        setEditForm({
                                            ...editForm,
                                            sss_loan: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="quick_pagibig_loan"
                                    className="text-xs font-semibold"
                                >
                                    Pag-IBIG Loan (₱)
                                </Label>
                                <Input
                                    id="quick_pagibig_loan"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={editForm.pagibig_loan}
                                    onChange={(e) =>
                                        setEditForm({
                                            ...editForm,
                                            pagibig_loan: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="quick_emergency_loan"
                                    className="text-xs font-semibold"
                                >
                                    Emergency Loan (₱)
                                </Label>
                                <Input
                                    id="quick_emergency_loan"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={editForm.emergency_loan}
                                    onChange={(e) =>
                                        setEditForm({
                                            ...editForm,
                                            emergency_loan: e.target.value,
                                        })
                                    }
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="quick_pagibig_contrib"
                                    className="text-xs font-semibold"
                                >
                                    Pag-IBIG Contrib (₱)
                                </Label>
                                <Input
                                    id="quick_pagibig_contrib"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={editForm.pagibig_contribution}
                                    onChange={(e) =>
                                        setEditForm({
                                            ...editForm,
                                            pagibig_contribution:
                                                e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="quick_tax"
                                    className="text-xs font-semibold"
                                >
                                    Tax W/Held (₱)
                                </Label>
                                <Input
                                    id="quick_tax"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={editForm.withholding_tax}
                                    onChange={(e) =>
                                        setEditForm({
                                            ...editForm,
                                            withholding_tax: e.target.value,
                                        })
                                    }
                                />
                            </div>
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setActiveEditEmployee(null)}
                                disabled={isSavingQuickSetup}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSavingQuickSetup}>
                                {isSavingQuickSetup
                                    ? 'Saving...'
                                    : 'Save & Re-Audit'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
