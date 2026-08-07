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
import { ShieldCheck, MinusCircle, Edit3, ArrowLeft } from 'lucide-react';

function formatCurrency(value?: string | number | null, isDeduction: boolean = false) {
    if (value === null || value === undefined || value === '') return isDeduction ? '-₱0.00' : '₱0.00';
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
        <div className="flex items-center justify-between gap-2 border-b border-border/40 py-2.5 last:border-0 min-w-0">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground truncate">
                {label}
            </span>
            <span
                className={`text-sm font-semibold shrink-0 ${
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
}: {
    employee: EmployeeType;
    attendance: AttendanceType[];
    payrolls: PayrollType[];
    hourlyRateSettings: { days_per_month: number; hours_per_day: number };
}) {
    const employeeHref = employeeShow(employee.id).url;
    const attendanceRecords = attendance ?? [];
    const payrollRecords = payrolls ?? [];

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
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate">
                            Employee Profile Details
                        </h1>
                        <p className="text-xs sm:text-sm font-normal text-muted-foreground mt-0.5 truncate">
                            Real-world profile configurations and constant payroll deductions.
                        </p>
                    </div>
                    <ContainerHeaderEnd>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto mt-2 sm:mt-0">
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
                    <div className="flex flex-col items-start gap-4 rounded-xl border border-border bg-card p-4 sm:p-6 sm:flex-row sm:items-center shadow-sm">
                        <div className="flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg sm:text-xl font-bold text-primary">
                            {getInitials(employee.name ?? '?')}
                        </div>
                        <div className="min-w-0 flex-1 w-full">
                            <h2 className="truncate text-lg sm:text-xl font-bold text-foreground">
                                {employee.name}
                            </h2>
                            <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
                                Designation: <span className="text-foreground font-semibold">{employee.position ?? 'Encoder'}</span>
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                                <Badge variant="outline" className="font-mono text-xs">
                                    Code: {employee.employee_code}
                                </Badge>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left sm:text-right w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-border">
                            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3">
                                <p className="text-xs uppercase font-bold text-emerald-700 dark:text-emerald-400">
                                    Daily Rate
                                </p>
                                <p className="text-base sm:text-lg font-extrabold text-emerald-700 dark:text-emerald-300">
                                    {formatCurrency(employee.daily_rate)}
                                </p>
                            </div>
                            <div className="rounded-lg bg-card border border-border p-3">
                                <p className="text-xs uppercase font-semibold text-muted-foreground">
                                    Monthly Salary
                                </p>
                                <p className="text-sm sm:text-base font-bold text-foreground">
                                    {formatCurrency(employee.base_salary)}
                                </p>
                            </div>
                            <div className="rounded-lg bg-card border border-border p-3">
                                <p className="text-xs uppercase font-semibold text-muted-foreground">
                                    Hourly Rate
                                </p>
                                <p className="text-sm sm:text-base font-bold text-foreground">
                                    {formatCurrency(employee.hourly_rate)}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        {/* Contact & Government Identification */}
                        <div className="rounded-xl border border-border bg-card p-4 sm:p-5 space-y-4 shadow-sm">
                            <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                                <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
                                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-foreground truncate">
                                    Contact & Government Identifiers
                                </h3>
                            </div>
                            <div className="space-y-1">
                                <DetailRow label="Contact Number" value={employee.contact_number} />
                                <DetailRow label="Address" value={employee.address} />
                                <DetailRow label="TIN Number" value={employee.tin} />
                                <DetailRow label="SSS Number" value={employee.sss_no} />
                                <DetailRow label="Pag-IBIG MID" value={employee.pagibig_no} />
                                <DetailRow label="PhilHealth No." value={employee.philhealth_no} />
                            </div>
                        </div>

                        {/* Constant Loan Deductions & Statutory Defaults */}
                        <div className="rounded-xl border border-border bg-card p-4 sm:p-5 space-y-4 shadow-sm">
                            <div className="flex items-center justify-between border-b border-border/60 pb-3">
                                <div className="flex items-center gap-2 min-w-0">
                                    <MinusCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0" />
                                    <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-foreground truncate">
                                        Constant Payroll Deductions
                                    </h3>
                                </div>
                                <span className="rounded-full bg-rose-100 dark:bg-rose-950/60 px-2.5 py-0.5 text-xs font-bold text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 shrink-0">
                                    - Per Cutoff
                                </span>
                            </div>
                            <div className="space-y-1">
                                <DetailRow label="SSS Loan Deduction" value={formatCurrency(employee.sss_loan, true)} isDeduction />
                                <DetailRow label="Pag-IBIG Loan Deduction" value={formatCurrency(employee.pagibig_loan, true)} isDeduction />
                                <DetailRow label="Emergency Loan Deduction" value={formatCurrency(employee.emergency_loan, true)} isDeduction />
                                <DetailRow label="Pag-IBIG Contribution" value={formatCurrency(employee.pagibig_contribution, true)} isDeduction />
                                <DetailRow label="SSS Contribution" value={formatCurrency(employee.sss_contribution, true)} isDeduction />
                                <DetailRow label="PhilHealth Contribution" value={formatCurrency(employee.philhealth_contribution, true)} isDeduction />
                                <DetailRow label="Tax W/Held Payable" value={formatCurrency(employee.withholding_tax, true)} isDeduction />
                            </div>
                        </div>
                    </div>
                </div>
            </Container>

            <Container>
                <ContainerHeader>
                    <div className="min-w-0 flex-1">
                        <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground truncate">
                            Attendance & Payroll History
                        </h2>
                        <p className="text-xs text-muted-foreground font-normal mt-0.5 truncate">
                            Historical records generated for this employee profile.
                        </p>
                    </div>
                    <ContainerHeaderEnd>
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                                Attendance {attendanceRecords.length}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                                Payrolls {payrollRecords.length}
                            </Badge>
                        </div>
                    </ContainerHeaderEnd>
                </ContainerHeader>

                <Tabs defaultValue="attendance" className="w-full">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <TabsList variant="line">
                            <TabsTrigger value="attendance" className="gap-2 text-xs sm:text-sm">
                                Attendance
                                <Badge variant="outline">
                                    {attendanceRecords.length}
                                </Badge>
                            </TabsTrigger>
                            <TabsTrigger value="payroll" className="gap-2 text-xs sm:text-sm">
                                Payroll
                                <Badge variant="outline">
                                    {payrollRecords.length}
                                </Badge>
                            </TabsTrigger>
                        </TabsList>
                    </div>

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
        </AppLayout>
    );
}
