import { Head, Link, router, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import {
    index as payrollIndex,
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { PayrollDetailType } from './payroll-types';
import { attendanceColumns } from '../Attendance/attendance-column-def';
import { attendanceBulkDelete } from '@/components/data-table/bulk-delete';
import {
    Printer,
    ArrowLeft,
    PlusCircle,
    MinusCircle,
    UserCheck,
    Calendar,
    FileSpreadsheet,
} from 'lucide-react';

const statusStyles: Record<string, string> = {
    draft: 'border-yellow-300 bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-300',
    pending: 'border-blue-300 bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300',
    paid: 'border-emerald-300 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
};

const statusLabels: Record<string, string> = {
    draft: 'Draft',
    pending: 'Pending',
    paid: 'Paid',
};

function formatCurrency(val?: string | number | null, isDeduction: boolean = false) {
    if (val === null || val === undefined || val === '') return isDeduction ? '-₱0.00' : '₱0.00';
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
    return d.toLocaleDateString('en-PH', { month: 'short', day: '2-digit', year: 'numeric' });
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
        <div className="flex items-center justify-between gap-2 border-b border-border/40 py-2.5 last:border-0 text-xs sm:text-sm min-w-0">
            <span className="font-medium text-muted-foreground truncate">{label}</span>
            <span
                className={`font-semibold shrink-0 ${
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
    const overtimePay = Math.max(0, grossPay - basicPay);

    const dailyRate = parseFloat(String(employee?.daily_rate || (Number(payroll.hourly_rate) * 8) || 0));

    const sssLoan = parseFloat(String(payroll.sss_loan ?? 0));
    const pagibigLoan = parseFloat(String(payroll.pagibig_loan ?? 0));
    const emergencyLoan = parseFloat(String(payroll.emergency_loan ?? 0));

    const { data, setData, processing } = useForm({
        status: payroll.status,
    });

    const handleStatusChange = (nextStatus: string) => {
        if (nextStatus === data.status) return;
        setData('status', nextStatus);
        router.patch(
            `/Payroll/${payroll.id}/status`,
            { status: nextStatus },
            { preserveScroll: true },
        );
    };

    const handleExportPdf = () => {
        window.open(`/Payroll/${payroll.id}/pdf`, '_blank');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Payroll Voucher - ${employee?.name ?? 'Employee'}`} />

            <Container>
                <ContainerHeader>
                    <div className="min-w-0 flex-1">
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate">
                            Payroll Voucher #{payroll.id}
                        </h1>
                        <p className="text-xs sm:text-sm font-normal text-muted-foreground mt-0.5 truncate">
                            Official financial breakdown and payslip register for {employee?.name ?? 'Employee'}.
                        </p>
                    </div>
                    <ContainerHeaderEnd>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                            <Badge className={`border px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${statusStyles[data.status]}`}>
                                {statusLabels[data.status] ?? data.status}
                            </Badge>

                            <Select value={data.status} onValueChange={handleStatusChange} disabled={processing}>
                                <SelectTrigger className="h-9 w-[120px] text-xs">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="paid">Paid</SelectItem>
                                </SelectContent>
                            </Select>

                            <Button size="sm" onClick={handleExportPdf} className="px-4 font-bold">
                                <Printer className="mr-1.5 h-4 w-4" />
                                Print Payslip PDF
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

                <div className="space-y-6 pt-2">
                    {/* Executive Net Pay Hero Banner */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-card p-4 sm:p-6 shadow-sm">
                        <div className="space-y-1 w-full sm:w-auto">
                            <span className="text-xs uppercase font-bold tracking-wider text-primary">
                                Net Amount Payable
                            </span>
                            <div className="text-2xl sm:text-3xl font-black text-primary">
                                {formatCurrency(netPay)}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground truncate">
                                <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                                Cutoff: <span className="font-bold text-foreground">{formatDate(payroll.period_start)} — {formatDate(payroll.period_end)}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left sm:text-right w-full sm:w-auto border-t sm:border-t-0 sm:border-l border-border/80 pt-3 sm:pt-0 sm:pl-6">
                            <div>
                                <p className="text-xs uppercase font-bold text-emerald-700 dark:text-emerald-400">
                                    Gross Earnings
                                </p>
                                <p className="text-base sm:text-lg font-extrabold text-emerald-700 dark:text-emerald-300">
                                    {formatCurrency(grossPay)}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs uppercase font-bold text-rose-700 dark:text-rose-400">
                                    Total Deductions
                                </p>
                                <p className="text-base sm:text-lg font-extrabold text-rose-700 dark:text-rose-300">
                                    {formatCurrency(deductions, true)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Financial Breakdown Grid (2 Columns) */}
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        {/* Left Column: Earnings Breakdown */}
                        <div className="rounded-xl border border-border bg-card p-4 sm:p-5 space-y-4 shadow-sm">
                            <div className="flex items-center justify-between border-b border-border/60 pb-3">
                                <div className="flex items-center gap-2 min-w-0">
                                    <PlusCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                    <h2 className="text-sm sm:text-base font-bold text-foreground truncate">
                                        Earnings Breakdown
                                    </h2>
                                </div>
                                <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                                    + Income Base
                                </span>
                            </div>

                            <div className="space-y-1">
                                <DetailRow label="Daily Rate" value={formatCurrency(dailyRate)} isEarnings />
                                <DetailRow label="Days Worked" value={`${payroll.days_worked ?? 0} Days`} />
                                <DetailRow label="Basic Pay (Daily × Days)" value={formatCurrency(basicPay)} />
                                <DetailRow label="Overtime / Holiday Pay" value={formatCurrency(overtimePay)} />
                                <div className="pt-2 border-t border-border flex justify-between font-bold text-foreground text-sm sm:text-base">
                                    <span>Total Gross Earnings:</span>
                                    <span className="text-emerald-600 dark:text-emerald-400">
                                        {formatCurrency(grossPay)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Itemized Deductions Breakdown */}
                        <div className="rounded-xl border border-border bg-card p-4 sm:p-5 space-y-4 shadow-sm">
                            <div className="flex items-center justify-between border-b border-border/60 pb-3">
                                <div className="flex items-center gap-2 min-w-0">
                                    <MinusCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0" />
                                    <h2 className="text-sm sm:text-base font-bold text-foreground truncate">
                                        Constant Loans & Deductions
                                    </h2>
                                </div>
                                <span className="rounded-full bg-rose-100 dark:bg-rose-950/60 px-2.5 py-0.5 text-xs font-bold text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 shrink-0">
                                    - Deductions
                                </span>
                            </div>

                            <div className="space-y-1">
                                <DetailRow label="SSS Loan Deduction" value={formatCurrency(sssLoan, true)} isDeduction />
                                <DetailRow label="Pag-IBIG Loan Deduction" value={formatCurrency(pagibigLoan, true)} isDeduction />
                                <DetailRow label="Emergency Loan Deduction" value={formatCurrency(emergencyLoan, true)} isDeduction />
                                <DetailRow label="Total Statutory & Tax Deductions" value={formatCurrency(deductions - (sssLoan + pagibigLoan + emergencyLoan), true)} isDeduction />
                                <div className="pt-2 border-t border-border flex justify-between font-bold text-foreground text-sm sm:text-base">
                                    <span>Total Deductions:</span>
                                    <span className="text-rose-600 dark:text-rose-400">
                                        {formatCurrency(deductions, true)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Employee Profile Account Details */}
                    <div className="rounded-xl border border-border bg-card p-4 sm:p-5 space-y-4 shadow-sm">
                        <div className="flex items-center justify-between border-b border-border/60 pb-3">
                            <div className="flex items-center gap-2 min-w-0">
                                <UserCheck className="h-5 w-5 text-primary shrink-0" />
                                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-foreground truncate">
                                    Employee Profile Account Details
                                </h3>
                            </div>
                            {employee?.id && (
                                <Button variant="outline" size="sm" asChild className="text-xs shrink-0">
                                    <Link href={employeeShow(employee.id).url}>
                                        View Profile
                                    </Link>
                                </Button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 text-xs sm:text-sm">
                            <div className="min-w-0">
                                <span className="text-xs text-muted-foreground uppercase font-semibold">Employee Name:</span>
                                <p className="font-bold text-foreground text-sm sm:text-base truncate">{employee?.name ?? payroll.employee_name ?? 'N/A'}</p>
                            </div>
                            <div className="min-w-0">
                                <span className="text-xs text-muted-foreground uppercase font-semibold">Designation:</span>
                                <p className="font-semibold text-foreground truncate">{employee?.position ?? 'Encoder'}</p>
                            </div>
                            <div className="min-w-0">
                                <span className="text-xs text-muted-foreground uppercase font-semibold">Employee Code:</span>
                                <p className="font-mono font-bold text-primary truncate">{employee?.employee_code ?? `EMP-${String(payroll.employee_id).padStart(3, '0')}`}</p>
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
                            <FileSpreadsheet className="h-5 w-5 text-primary shrink-0" />
                            <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground truncate">
                                Attendance Log Records
                            </h2>
                        </div>
                        <p className="text-xs text-muted-foreground font-normal mt-0.5 truncate">
                            Daily attendance entries recorded for this pay period ({formatDate(payroll.period_start)} to {formatDate(payroll.period_end)}).
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
