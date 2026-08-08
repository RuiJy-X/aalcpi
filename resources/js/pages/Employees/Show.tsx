import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import type { EmployeeType } from './employeeTypes';
import AppLayout from '@/layouts/app-layout';
import {
    index as employeeIndex,
    show as employeeShow,
    edit as employeeEdit,
} from '@/routes/employees';
import { show as payrollShow } from '@/routes/payroll';
import type { BreadcrumbItem } from '@/types';
import {
    Container,
    ContainerHeader,
    ContainerHeaderEnd,
} from '@/components/container';
import { DataTable } from '@/components/data-table/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { AttendanceType } from '../Attendance/attendance-types';
import { attendanceColumns } from '../Attendance/attendance-column-def';
import type { PayrollType } from '../Payroll/payroll-types';
import { payrollColumns } from '../Payroll/payroll-column-def';
import {
    attendanceBulkDelete,
    payrollBulkDelete,
} from '@/components/data-table/bulk-delete';
import {
    ShieldCheck,
    MinusCircle,
    Edit3,
    ArrowLeft,
    HandCoins,
    Clock,
    PlusCircle,
} from 'lucide-react';
import { RecordAdvancementModal } from '@/components/RecordAdvancementModal';

interface AdvancementRecord {
    id: number;
    amount: number;
    remaining_balance: number;
    advancement_date: string;
    status: string;
    notes?: string;
    created_at?: string;
}

const statusBadges: Record<string, { label: string; class: string }> = {
    pending_payout: {
        label: 'Pending Payout',
        class: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300',
    },
    paid_out: {
        label: 'Paid Out (Repaying)',
        class: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300',
    },
    partially_deducted: {
        label: 'Partially Deducted',
        class: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/60 dark:text-orange-300',
    },
    deducted: {
        label: 'Fully Repaid',
        class: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300',
    },
    cancelled: {
        label: 'Cancelled',
        class: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-900 dark:text-slate-400',
    },
};

function formatCurrency(
    value?: string | number | null,
    isDeduction: boolean = false,
) {
    if (value === null || value === undefined || value === '')
        return isDeduction ? '-₱0.00' : '₱0.00';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return isDeduction ? '-₱0.00' : '₱0.00';
    const formatted = new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
    }).format(num);
    return isDeduction && num > 0 ? `-${formatted}` : formatted;
}

function getInitials(name: string) {
    return name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

function DetailRow({
    label,
    value,
    isDeduction = false,
    isEarnings = false,
}: {
    label: string;
    value?: string | null;
    isDeduction?: boolean;
    isEarnings?: boolean;
}) {
    return (
        <div className="flex min-w-0 items-center justify-between gap-2 border-b border-border/40 py-2.5 last:border-0">
            <span className="truncate text-xs font-medium tracking-wider text-muted-foreground uppercase">
                {label}
            </span>
            <span
                className={`shrink-0 text-sm font-semibold ${
                    isDeduction
                        ? 'text-rose-600 dark:text-rose-400'
                        : isEarnings
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-foreground'
                }`}
            >
                {value || 'N/A'}
            </span>
        </div>
    );
}

export default function Show({
    employee,
    attendance,
    payrolls,
    advancements = [],
}: {
    employee: EmployeeType;
    attendance: AttendanceType[];
    payrolls: PayrollType[];
    advancements?: AdvancementRecord[];
    hourlyRateSettings: { days_per_month: number; hours_per_day: number };
}) {
    const [isGrantAdvanceOpen, setIsGrantAdvanceOpen] = useState(false);
    const employeeHref = employeeShow(employee.id).url;
    const attendanceRecords = attendance ?? [];
    const payrollRecords = payrolls ?? [];

    const pendingPayoutVal = parseFloat(
        String(employee.pending_advancement_payout ?? 0),
    );
    const advanceBalanceVal = parseFloat(
        String(employee.cash_advance_balance ?? 0),
    );

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Employee Management', href: employeeIndex().url },
        { title: 'Employee Profile', href: employeeHref },
        { title: employee.name, href: employeeHref },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${employee.name} | Employee Profile`} />

            <Container>
                <ContainerHeader>
                    <div className="min-w-0 flex-1">
                        <h1 className="truncate text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                            Employee Profile Details
                        </h1>
                        <p className="mt-0.5 truncate text-xs font-normal text-muted-foreground sm:text-sm">
                            Real-world profile configurations, queued cash
                            advances, and payroll deductions.
                        </p>
                    </div>
                    <ContainerHeaderEnd>
                        <div className="mt-2 flex w-full flex-wrap items-center gap-2 sm:mt-0 sm:w-auto sm:gap-3">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsGrantAdvanceOpen(true)}
                                className="border-emerald-500/30 bg-emerald-500/10 text-xs font-semibold text-emerald-700 hover:bg-emerald-500/20 sm:text-sm dark:text-emerald-300"
                            >
                                <HandCoins className="mr-1.5 h-4 w-4" />+ Grant
                                Cash Advance
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                                <Link href={employeeIndex().url}>
                                    <ArrowLeft className="mr-1.5 h-4 w-4" />
                                    Back to List
                                </Link>
                            </Button>
                            <Button size="sm" asChild className="px-4">
                                <Link href={employeeEdit(employee.id).url}>
                                    <Edit3 className="mr-1.5 h-4 w-4" />
                                    Edit Profile
                                </Link>
                            </Button>
                        </div>
                    </ContainerHeaderEnd>
                </ContainerHeader>

                <div className="space-y-6 pt-2">
                    {/* Profile Executive Banner */}
                    <div className="flex flex-col items-start gap-4 rounded-xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:p-6">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary sm:h-16 sm:w-16 sm:text-xl">
                            {getInitials(employee.name ?? '?')}
                        </div>
                        <div className="w-full min-w-0 flex-1">
                            <h2 className="truncate text-lg font-bold text-foreground sm:text-xl">
                                {employee.name}
                            </h2>
                            <p className="truncate text-xs font-medium text-muted-foreground sm:text-sm">
                                Designation:{' '}
                                <span className="font-semibold text-foreground">
                                    {employee.position ?? 'Encoder'}
                                </span>
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                                <Badge
                                    variant="outline"
                                    className="font-mono text-xs"
                                >
                                    Code: {employee.employee_code}
                                </Badge>
                            </div>
                        </div>
                        <div className="grid w-full grid-cols-1 gap-3 border-t border-border pt-2 text-left sm:w-auto sm:grid-cols-4 sm:border-t-0 sm:pt-0 sm:text-right">
                            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3">
                                <p className="text-xs font-bold text-emerald-700 uppercase dark:text-emerald-400">
                                    Daily Rate
                                </p>
                                <p className="text-base font-extrabold text-emerald-700 sm:text-lg dark:text-emerald-300">
                                    {formatCurrency(employee.daily_rate)}
                                </p>
                            </div>
                            <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3">
                                <p className="text-xs font-bold text-amber-700 uppercase dark:text-amber-300">
                                    Adv Payout Queued (+)
                                </p>
                                <p className="text-base font-extrabold text-amber-800 sm:text-lg dark:text-amber-200">
                                    {pendingPayoutVal > 0
                                        ? formatCurrency(pendingPayoutVal)
                                        : '—'}
                                </p>
                            </div>
                            <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-3">
                                <p className="text-xs font-bold text-rose-700 uppercase dark:text-rose-400">
                                    Adv Loan Balance (-)
                                </p>
                                <p className="text-base font-extrabold text-rose-800 sm:text-lg dark:text-rose-200">
                                    {advanceBalanceVal > 0
                                        ? formatCurrency(
                                              advanceBalanceVal,
                                              true,
                                          )
                                        : '—'}
                                </p>
                            </div>
                            <div className="rounded-lg border border-border bg-card p-3">
                                <p className="text-xs font-semibold text-muted-foreground uppercase">
                                    Monthly Salary
                                </p>
                                <p className="text-sm font-bold text-foreground sm:text-base">
                                    {formatCurrency(employee.base_salary)}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        {/* Contact & Government Identification */}
                        <div className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
                            <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                                <ShieldCheck className="h-5 w-5 shrink-0 text-primary" />
                                <h3 className="truncate text-xs font-bold tracking-wider text-foreground uppercase sm:text-sm">
                                    Contact & Government Identifiers
                                </h3>
                            </div>
                            <div className="space-y-1">
                                <DetailRow
                                    label="Contact Number"
                                    value={employee.contact_number}
                                />
                                <DetailRow
                                    label="Address"
                                    value={employee.address}
                                />
                                <DetailRow
                                    label="TIN Number"
                                    value={employee.tin}
                                />
                                <DetailRow
                                    label="SSS Number"
                                    value={employee.sss_no}
                                />
                                <DetailRow
                                    label="Pag-IBIG MID"
                                    value={employee.pagibig_no}
                                />
                                <DetailRow
                                    label="PhilHealth No."
                                    value={employee.philhealth_no}
                                />
                            </div>
                        </div>

                        {/* Constant Loan Deductions & Statutory Defaults */}
                        <div className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
                            <div className="flex items-center justify-between border-b border-border/60 pb-3">
                                <div className="flex min-w-0 items-center gap-2">
                                    <MinusCircle className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
                                    <h3 className="truncate text-xs font-bold tracking-wider text-foreground uppercase sm:text-sm">
                                        Constant Payroll Deductions & Loans
                                    </h3>
                                </div>
                                <span className="shrink-0 rounded-full border border-rose-200 bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-700 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                                    - Per Cutoff
                                </span>
                            </div>
                            <div className="space-y-1">
                                <DetailRow
                                    label="Upcoming Advancement Payout (Queued)"
                                    value={
                                        pendingPayoutVal > 0
                                            ? formatCurrency(pendingPayoutVal)
                                            : 'No Pending Payout'
                                    }
                                    isEarnings={pendingPayoutVal > 0}
                                />
                                <DetailRow
                                    label="Advancement Loan Balance (Unpaid)"
                                    value={
                                        advanceBalanceVal > 0
                                            ? formatCurrency(
                                                  advanceBalanceVal,
                                                  true,
                                              )
                                            : 'No Loan Balance'
                                    }
                                    isDeduction={advanceBalanceVal > 0}
                                />
                                <DetailRow
                                    label="SSS Loan Deduction"
                                    value={formatCurrency(
                                        employee.sss_loan,
                                        true,
                                    )}
                                    isDeduction
                                />
                                <DetailRow
                                    label="Pag-IBIG Contribution"
                                    value={formatCurrency(
                                        employee.pagibig_contribution,
                                        true,
                                    )}
                                    isDeduction
                                />
                                <DetailRow
                                    label="Emergency Loan Deduction"
                                    value={formatCurrency(
                                        employee.emergency_loan,
                                        true,
                                    )}
                                    isDeduction
                                />
                                <DetailRow
                                    label="Tax W/Held Payable"
                                    value={formatCurrency(
                                        employee.withholding_tax,
                                        true,
                                    )}
                                    isDeduction
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </Container>

            <Container>
                <ContainerHeader>
                    <div className="min-w-0 flex-1">
                        <h2 className="truncate text-base font-bold tracking-tight text-foreground sm:text-lg">
                            History & Activity Logs
                        </h2>
                        <p className="mt-0.5 truncate text-xs font-normal text-muted-foreground">
                            Historical attendance, payroll vouchers, and cash
                            advance records for this employee.
                        </p>
                    </div>
                    <ContainerHeaderEnd>
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                                Advancements {advancements.length}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                                Attendance {attendanceRecords.length}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                                Payrolls {payrollRecords.length}
                            </Badge>
                        </div>
                    </ContainerHeaderEnd>
                </ContainerHeader>

                <Tabs defaultValue="advancements" className="w-full">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <TabsList variant="line">
                            <TabsTrigger
                                value="advancements"
                                className="gap-2 text-xs sm:text-sm"
                            >
                                Cash Advancements
                                <Badge
                                    variant="outline"
                                    className="bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                                >
                                    {advancements.length}
                                </Badge>
                            </TabsTrigger>
                            <TabsTrigger
                                value="attendance"
                                className="gap-2 text-xs sm:text-sm"
                            >
                                Attendance
                                <Badge variant="outline">
                                    {attendanceRecords.length}
                                </Badge>
                            </TabsTrigger>
                            <TabsTrigger
                                value="payroll"
                                className="gap-2 text-xs sm:text-sm"
                            >
                                Payroll History
                                <Badge variant="outline">
                                    {payrollRecords.length}
                                </Badge>
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="advancements" className="mt-4">
                        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
                            <table className="w-full text-left text-xs">
                                <thead className="border-b border-border bg-muted/50 font-semibold tracking-wider text-muted-foreground uppercase">
                                    <tr>
                                        <th className="p-3">
                                            Advancement Date
                                        </th>
                                        <th className="p-3 text-right">
                                            Original Advance (+)
                                        </th>
                                        <th className="p-3 text-right">
                                            Remaining Unpaid (-)
                                        </th>
                                        <th className="p-3 text-center">
                                            Status
                                        </th>
                                        <th className="p-3">Notes / Purpose</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/60">
                                    {advancements.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={5}
                                                className="p-8 text-center text-muted-foreground"
                                            >
                                                No cash advancements recorded
                                                for this employee.
                                            </td>
                                        </tr>
                                    ) : (
                                        advancements.map((adv) => {
                                            const badge = statusBadges[
                                                adv.status
                                            ] || {
                                                label: adv.status,
                                                class: '',
                                            };
                                            return (
                                                <tr
                                                    key={adv.id}
                                                    className="hover:bg-muted/30"
                                                >
                                                    <td className="p-3 font-medium whitespace-nowrap">
                                                        {adv.advancement_date}
                                                    </td>
                                                    <td className="p-3 text-right font-bold whitespace-nowrap text-emerald-600 dark:text-emerald-400">
                                                        ₱{adv.amount.toFixed(2)}
                                                    </td>
                                                    <td className="p-3 text-right font-bold whitespace-nowrap text-rose-600 dark:text-rose-400">
                                                        ₱
                                                        {adv.remaining_balance.toFixed(
                                                            2,
                                                        )}
                                                    </td>
                                                    <td className="p-3 text-center whitespace-nowrap">
                                                        <Badge
                                                            variant="outline"
                                                            className={`text-[10px] font-bold tracking-wider uppercase ${badge.class}`}
                                                        >
                                                            {badge.label}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-3 text-muted-foreground">
                                                        {adv.notes || '—'}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </TabsContent>

                    <TabsContent value="attendance" className="mt-4">
                        <DataTable
                            data={attendanceRecords}
                            columns={attendanceColumns}
                            bulkDelete={attendanceBulkDelete}
                        />
                    </TabsContent>

                    <TabsContent value="payroll" className="mt-4">
                        <DataTable
                            data={payrollRecords}
                            columns={payrollColumns}
                            onRowDoubleClick={(row) => payrollShow(row.id).url}
                            bulkDelete={payrollBulkDelete}
                        />
                    </TabsContent>
                </Tabs>
            </Container>

            {/* Grant Cash Advancement Modal */}
            <RecordAdvancementModal
                isOpen={isGrantAdvanceOpen}
                onClose={() => setIsGrantAdvanceOpen(false)}
                preselectedEmployeeId={employee.id}
            />
        </AppLayout>
    );
}
