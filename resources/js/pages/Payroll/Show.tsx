import React, { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import {
    index as payrollIndex,
    destroy as payrollDestroy,
} from '@/routes/payroll';
import { show as employeeShow } from '@/routes/employees';
import {
    Container,
    ContainerHeader,
    ContainerHeaderEnd,
} from '@/components/container';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/data-table/data-table';
import type { PayrollDetailType } from './payroll-types';
import { attendanceColumns } from '../Attendance/attendance-column-def';
import { attendanceBulkDelete } from '@/components/data-table/bulk-delete';
import { ConfirmPaidModal } from '@/components/ConfirmPaidModal';
import {
    Printer,
    ArrowLeft,
    PlusCircle,
    MinusCircle,
    UserCheck,
    Calendar,
    FileSpreadsheet,
    Check,
    HandCoins,
    RotateCcw,
    Trash2,
    Download,
    FileText,
} from 'lucide-react';
import { ConfirmDeleteModal } from '@/components/ConfirmDeleteModal';

const statusStyles: Record<string, string> = {
    draft: 'border-yellow-300 bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-300',
    pending:
        'border-blue-300 bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300',
    paid: 'border-emerald-300 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
};

const statusLabels: Record<string, string> = {
    draft: 'Draft',
    pending: 'Pending',
    paid: 'Paid',
};

function formatCurrency(
    val?: string | number | null,
    isDeduction: boolean = false,
) {
    if (val === null || val === undefined || val === '')
        return isDeduction ? '-₱0.00' : '₱0.00';
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num)) return isDeduction ? '-₱0.00' : '₱0.00';
    const formatted = new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
    }).format(num);
    return isDeduction && num > 0 ? `-${formatted}` : formatted;
}

function formatDate(val?: string | null) {
    if (!val) return 'N/A';
    const d = new Date(val);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('en-PH', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
    });
}

function DetailRow({
    label,
    value,
    isDeduction = false,
    isEarnings = false,
}: {
    label: string;
    value?: string | number | null;
    isDeduction?: boolean;
    isEarnings?: boolean;
}) {
    return (
        <div className="flex min-w-0 items-center justify-between gap-2 border-b border-border/40 py-2.5 text-xs last:border-0 sm:text-sm">
            <span className="truncate font-medium text-muted-foreground">
                {label}
            </span>
            <span
                className={`shrink-0 font-semibold ${
                    isDeduction
                        ? 'text-rose-600 dark:text-rose-400'
                        : isEarnings
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-foreground'
                }`}
            >
                {typeof value === 'number' || typeof value === 'string'
                    ? value
                    : 'N/A'}
            </span>
        </div>
    );
}

export default function Show({ payroll }: { payroll: PayrollDetailType }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Payroll Management', href: payrollIndex().url },
        { title: `Payroll #${payroll.id}`, href: `/Payroll/${payroll.id}` },
    ];

    const employee = payroll.employee;
    const attendanceRecords = employee?.attendances ?? [];

    const grossPay = parseFloat(String(payroll.gross_pay || 0));
    const deductions = parseFloat(String(payroll.deductions || 0));
    const netPay = parseFloat(String(payroll.net_pay || 0));
    const basicPay = parseFloat(String(payroll.basic_pay || 0));
    const cashAdvancePayout = parseFloat(
        String(payroll.cash_advance_payout || 0),
    );
    const cashAdvanceDeduction = parseFloat(
        String(payroll.cash_advance_deduction || 0),
    );
    const overtimePay = parseFloat(
        String(
            payroll.overtime_pay ??
                Math.max(0, grossPay - basicPay - cashAdvancePayout),
        ),
    );
    const overtimeHours = parseFloat(String(payroll.overtime_hours ?? 0));

    const dailyRate = parseFloat(
        String(employee?.daily_rate || Number(payroll.hourly_rate) * 8 || 0),
    );

    const holidayPay = parseFloat(
        String(
            (payroll as any).holiday_pay ??
                dailyRate * Number(payroll.holidays ?? 0),
        ),
    );
    const holidaysCount = Number(payroll.holidays ?? 0);

    const sssContrib = parseFloat(String((payroll as any).sss_contribution ?? (payroll as any).sss_loan ?? employee?.sss_contribution ?? employee?.sss_loan ?? 0));
    const pagibigContrib = parseFloat(String((payroll as any).pagibig_contribution ?? employee?.pagibig_contribution ?? 0));
    const philhealthContrib = parseFloat(String((payroll as any).philhealth_contribution ?? employee?.philhealth_contribution ?? 0));
    const emergencyLoan = parseFloat(String((payroll as any).emergency_loan ?? employee?.emergency_loan ?? 0));
    const withholdingTax = parseFloat(String((payroll as any).withholding_tax ?? employee?.withholding_tax ?? 0));

    const { data, setData } = useForm({
        status: payroll.status,
    });
    const [isPaidModalOpen, setIsPaidModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const handleStatusChange = (nextStatus: string) => {
        if (nextStatus === data.status) return;
        setData('status', nextStatus);
        router.patch(
            `/Payroll/${payroll.id}/status`,
            { status: nextStatus },
            { preserveScroll: true },
        );
    };

    const handleConfirmPaid = () => {
        setIsPaidModalOpen(false);
        handleStatusChange('paid');
    };

    const handleConfirmDelete = () => {
        setIsDeleteModalOpen(false);
        router.delete(payrollDestroy(payroll.id).url, {
            onSuccess: () => {
                router.visit(payrollIndex().url);
            },
        });
    };

    const handleExportPdf = () => {
        window.open(`/Payroll/${payroll.id}/pdf`, '_blank');
    };

    const handleExportStatementOfAccountPdf = () => {
        window.open(`/Payroll/${payroll.id}/statement-of-account-pdf`, '_blank');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Payroll Voucher - ${employee?.name ?? 'Employee'}`} />

            <Container>
                <ContainerHeader>
                    <div className="min-w-0 flex-1">
                        <h1 className="truncate text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                            Payroll Voucher #{payroll.id}
                        </h1>
                        <p className="mt-0.5 truncate text-xs font-normal text-muted-foreground sm:text-sm">
                            Official financial breakdown and payslip register
                            for {employee?.name ?? 'Employee'}.
                        </p>
                    </div>
                    <ContainerHeaderEnd>
                        <div className="mt-2 flex w-full flex-wrap items-center gap-2 sm:mt-0 sm:w-auto sm:gap-3">
                            <Badge
                                className={`border px-2.5 py-1 text-xs font-bold tracking-wider uppercase ${statusStyles[data.status]}`}
                            >
                                {statusLabels[data.status] ?? data.status}
                            </Badge>

                            {data.status === 'draft' && (
                                <>
                                    <Button
                                        size="sm"
                                        className="h-9 bg-blue-600 px-3 text-xs font-semibold text-white shadow-xs hover:bg-blue-700"
                                        onClick={() =>
                                            handleStatusChange('pending')
                                        }
                                    >
                                        <Check className="mr-1.5 h-3.5 w-3.5" />
                                        Approve
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        className="h-9 px-3 text-xs font-semibold shadow-xs"
                                        onClick={() =>
                                            setIsDeleteModalOpen(true)
                                        }
                                    >
                                        <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                                        Delete
                                    </Button>
                                </>
                            )}

                            {data.status === 'pending' && (
                                <>
                                    <Button
                                        size="sm"
                                        className="h-9 bg-emerald-600 px-3 text-xs font-bold text-white shadow-xs hover:bg-emerald-700"
                                        onClick={() => setIsPaidModalOpen(true)}
                                    >
                                        <HandCoins className="mr-1.5 h-3.5 w-3.5" />
                                        Paid
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-9 border-amber-300 px-3 text-xs font-semibold text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-950/40"
                                        onClick={() =>
                                            handleStatusChange('draft')
                                        }
                                    >
                                        <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                                        Cancel
                                    </Button>
                                </>
                            )}

                            {data.status === 'paid' && (
                                <Badge className="border-emerald-300 bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                    Paid & Finalized
                                </Badge>
                            )}

                            <Button
                                size="sm"
                                onClick={handleExportPdf}
                                className="px-4 font-bold"
                            >
                                <Printer className="mr-1.5 h-4 w-4" />
                                Print Payslip PDF
                            </Button>

                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleExportStatementOfAccountPdf}
                                className="h-9 px-3 font-semibold border-slate-300 dark:border-slate-700"
                            >
                                <FileText className="mr-1.5 h-4 w-4" />
                                Statement of Account (PDF)
                            </Button>

                            <Button variant="outline" size="sm" asChild>
                                <Link href={payrollIndex().url}>
                                    <ArrowLeft className="mr-1.5 h-4 w-4" />
                                    Back
                                </Link>
                            </Button>
                        </div>
                    </ContainerHeaderEnd>
                </ContainerHeader>

                <ConfirmPaidModal
                    isOpen={isPaidModalOpen}
                    onClose={() => setIsPaidModalOpen(false)}
                    onConfirm={handleConfirmPaid}
                    employeeName={employee?.name}
                    payrollId={payroll.id}
                />

                <ConfirmDeleteModal
                    isOpen={isDeleteModalOpen}
                    onClose={() => setIsDeleteModalOpen(false)}
                    onConfirm={handleConfirmDelete}
                    description={`Are you sure you want to delete this draft payroll record? Any associated cash advance deductions will be safely reverted.`}
                />

                <div className="space-y-6 pt-2">
                    {/* Executive Net Pay Hero Banner */}
                    <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-card p-4 shadow-sm sm:flex-row sm:items-center sm:p-6">
                        <div className="w-full space-y-1 sm:w-auto">
                            <span className="text-xs font-bold tracking-wider text-primary uppercase">
                                Net Amount Payable
                            </span>
                            <div className="text-2xl font-black text-primary sm:text-3xl">
                                {formatCurrency(netPay)}
                            </div>
                            <div className="flex items-center gap-1.5 truncate text-xs font-medium text-muted-foreground">
                                <Calendar className="h-3.5 w-3.5 shrink-0 text-primary" />
                                Cutoff:{' '}
                                <span className="font-bold text-foreground">
                                    {formatDate(payroll.period_start)} —{' '}
                                    {formatDate(payroll.period_end)}
                                </span>
                            </div>
                        </div>

                        <div className="grid w-full grid-cols-1 gap-3 border-t border-border/80 pt-3 text-left sm:w-auto sm:grid-cols-2 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-6 sm:text-right">
                            <div>
                                <p className="text-xs font-bold text-emerald-700 uppercase dark:text-emerald-400">
                                    Gross Earnings
                                </p>
                                <p className="text-base font-extrabold text-emerald-700 sm:text-lg dark:text-emerald-300">
                                    {formatCurrency(grossPay)}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-rose-700 uppercase dark:text-rose-400">
                                    Total Deductions
                                </p>
                                <p className="text-base font-extrabold text-rose-700 sm:text-lg dark:text-rose-300">
                                    {formatCurrency(deductions, true)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Financial Breakdown Grid (2 Columns) */}
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        {/* Left Column: Earnings Breakdown */}
                        <div className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
                            <div className="flex items-center justify-between border-b border-border/60 pb-3">
                                <div className="flex min-w-0 items-center gap-2">
                                    <PlusCircle className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                                    <h2 className="truncate text-sm font-bold text-foreground sm:text-base">
                                        Earnings Breakdown
                                    </h2>
                                </div>
                                <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                    + Income Base
                                </span>
                            </div>

                            <div className="space-y-1">
                                <DetailRow
                                    label="Daily Rate"
                                    value={formatCurrency(dailyRate)}
                                    isEarnings
                                />
                                <DetailRow
                                    label="Days Worked"
                                    value={`${payroll.days_worked ?? 0} Days`}
                                />
                                <DetailRow
                                    label="Basic Pay (Daily × Days)"
                                    value={formatCurrency(basicPay)}
                                />
                                <DetailRow
                                    label={
                                        overtimeHours > 0
                                            ? `Overtime Pay (${overtimeHours} hrs)`
                                            : 'Overtime Pay (+)'
                                    }
                                    value={formatCurrency(overtimePay)}
                                    isEarnings={overtimePay > 0}
                                />
                                <DetailRow
                                    label={
                                        holidaysCount > 0
                                            ? `Holiday Pay (${holidaysCount} days)`
                                            : 'Holiday Pay (+)'
                                    }
                                    value={formatCurrency(holidayPay)}
                                    isEarnings={holidayPay > 0}
                                />
                                <DetailRow
                                    label="Cash Advance Payout (+)"
                                    value={formatCurrency(
                                        payroll.cash_advance_payout,
                                    )}
                                    isEarnings={
                                        parseFloat(
                                            String(
                                                payroll.cash_advance_payout ??
                                                    0,
                                            ),
                                        ) > 0
                                    }
                                />
                                <div className="flex justify-between border-t border-border pt-2 text-sm font-bold text-foreground sm:text-base">
                                    <span>Total Gross Earnings:</span>
                                    <span className="text-emerald-600 dark:text-emerald-400">
                                        {formatCurrency(grossPay)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Itemized Deductions Breakdown */}
                        <div className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
                            <div className="flex items-center justify-between border-b border-border/60 pb-3">
                                <div className="flex min-w-0 items-center gap-2">
                                    <MinusCircle className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
                                    <h2 className="truncate text-sm font-bold text-foreground sm:text-base">
                                        Constant Loans & Deductions
                                    </h2>
                                </div>
                                <span className="shrink-0 rounded-full border border-rose-200 bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-700 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                                    - Deductions
                                </span>
                            </div>

                            <div className="space-y-1">
                                <DetailRow
                                    label="Cash Advance Repayment Deduction (-)"
                                    value={formatCurrency(
                                        payroll.cash_advance_deduction,
                                        true,
                                    )}
                                    isDeduction={
                                        parseFloat(
                                            String(
                                                payroll.cash_advance_deduction ??
                                                    0,
                                            ),
                                        ) > 0
                                    }
                                />
                                <DetailRow
                                    label="SSS Contribution"
                                    value={formatCurrency(sssContrib, true)}
                                    isDeduction
                                />
                                <DetailRow
                                    label="Pag-IBIG Contribution"
                                    value={formatCurrency(pagibigContrib, true)}
                                    isDeduction
                                />
                                <DetailRow
                                    label="PhilHealth Contribution"
                                    value={formatCurrency(philhealthContrib, true)}
                                    isDeduction
                                />
                                <DetailRow
                                    label="Emergency Loan Deduction"
                                    value={formatCurrency(emergencyLoan, true)}
                                    isDeduction
                                />
                                <DetailRow
                                    label="Tax W/Held Payable"
                                    value={formatCurrency(withholdingTax, true)}
                                    isDeduction
                                />
                                <div className="flex justify-between border-t border-border pt-2 text-sm font-bold text-foreground sm:text-base">
                                    <span>Total Deductions:</span>
                                    <span className="text-rose-600 dark:text-rose-400">
                                        {formatCurrency(deductions, true)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Employee Profile Account Details */}
                    <div className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
                        <div className="flex items-center justify-between border-b border-border/60 pb-3">
                            <div className="flex min-w-0 items-center gap-2">
                                <UserCheck className="h-5 w-5 shrink-0 text-primary" />
                                <h3 className="truncate text-xs font-bold tracking-wider text-foreground uppercase sm:text-sm">
                                    Employee Profile Account Details
                                </h3>
                            </div>
                            {employee?.id && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    asChild
                                    className="shrink-0 text-xs"
                                >
                                    <Link href={employeeShow(employee.id).url}>
                                        View Profile
                                    </Link>
                                </Button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-3 sm:text-sm">
                            <div className="min-w-0">
                                <span className="text-xs font-semibold text-muted-foreground uppercase">
                                    Employee Name:
                                </span>
                                <p className="truncate text-sm font-bold text-foreground sm:text-base">
                                    {employee?.name ??
                                        payroll.employee_name ??
                                        'N/A'}
                                </p>
                            </div>
                            <div className="min-w-0">
                                <span className="text-xs font-semibold text-muted-foreground uppercase">
                                    Designation:
                                </span>
                                <p className="truncate font-semibold text-foreground">
                                    {employee?.position ?? 'Encoder'}
                                </p>
                            </div>
                            <div className="min-w-0">
                                <span className="text-xs font-semibold text-muted-foreground uppercase">
                                    Employee Code:
                                </span>
                                <p className="truncate font-mono font-bold text-primary">
                                    {employee?.employee_code ??
                                        `EMP-${String(payroll.employee_id).padStart(3, '0')}`}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </Container>

            {/* Attendance Logs Table */}
            <Container>
                <ContainerHeader>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <FileSpreadsheet className="h-5 w-5 shrink-0 text-primary" />
                            <h2 className="truncate text-base font-bold tracking-tight text-foreground sm:text-lg">
                                Attendance Log Records
                            </h2>
                        </div>
                        <p className="mt-0.5 truncate text-xs font-normal text-muted-foreground">
                            Daily attendance entries recorded for this pay
                            period ({formatDate(payroll.period_start)} to{' '}
                            {formatDate(payroll.period_end)}).
                        </p>
                    </div>
                </ContainerHeader>

                <div className="pt-2">
                    <DataTable
                        data={attendanceRecords}
                        columns={attendanceColumns}
                        bulkDelete={attendanceBulkDelete}
                    />
                </div>
            </Container>
        </AppLayout>
    );
}
