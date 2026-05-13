import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { index as payrollIndex, show as payrollShow } from '@/routes/payroll';
import { show as employeeShow } from '@/routes/Employees';
import {
    Container,
    ContainerHeader,
    ContainerHeaderEnd,
} from '@/components/container';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { formatMoney } from './generate-payroll.utils';
import type { PayrollDetailType } from './payroll-types';

const statusStyles: Record<string, string> = {
    draft: 'border-yellow-200 bg-yellow-50 text-yellow-800',
    released: 'border-blue-200 bg-blue-50 text-blue-800',
    paid: 'border-emerald-200 bg-emerald-50 text-emerald-800',
};

const formatDate = (value?: string | null) => {
    if (!value) {
        return 'N/A';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return 'N/A';
    }

    return date.toLocaleDateString();
};

const formatDateTime = (value?: string | null) => {
    if (!value) {
        return 'N/A';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return 'N/A';
    }

    return date.toLocaleString();
};

const toNumber = (value?: string | number | null) => {
    const parsed = Number(value ?? 0);
    return Number.isFinite(parsed) ? parsed : 0;
};

export default function Show({ payroll }: { payroll: PayrollDetailType }) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Payroll Management',
            href: payrollIndex().url,
        },
        // {
        //     title: `Payroll #${payroll.id}`,
        //     href: payrollShow(payroll.id).url,
        // },
    ];

    const employee = payroll.employee;
    const grossPay = toNumber(payroll.gross_pay);
    const deductions = toNumber(payroll.deductions);
    const netPay = toNumber(payroll.net_pay);
    const basicPay = toNumber(payroll.basic_pay);
    const deductionRate =
        grossPay > 0 ? Math.min(100, (deductions / grossPay) * 100) : 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Payroll #${payroll.id}`} />

            <Container>
                <ContainerHeader>
                    Payroll #{payroll.id}
                    <ContainerHeaderEnd>
                        <div className="flex items-center gap-2">
                            <Badge
                                className={`border px-3 py-1 text-xs font-semibold ${statusStyles[payroll.status] ?? 'border-slate-200 bg-slate-50 text-slate-700'}`}
                            >
                                {payroll.status}
                            </Badge>
                            <Button variant="outline" asChild>
                                <Link href={payrollIndex().url}>
                                    Back to list
                                </Link>
                            </Button>
                        </div>
                    </ContainerHeaderEnd>
                </ContainerHeader>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <Card className="relative overflow-hidden border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-slate-50 lg:col-span-2">
                        <CardHeader className="gap-2">
                            <CardTitle className="text-base text-slate-700">
                                Net Pay Summary
                            </CardTitle>
                            <div className="text-3xl font-semibold text-emerald-700">
                                ₱{formatMoney(netPay)}
                            </div>
                            <div className="text-sm text-slate-500">
                                {formatDate(payroll.period_start)} -{' '}
                                {formatDate(payroll.period_end)}
                            </div>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="rounded-lg border border-slate-200/70 bg-white/80 p-3">
                                <div className="text-xs tracking-wide text-slate-500 uppercase">
                                    Employee
                                </div>
                                <div className="text-base font-semibold text-slate-800">
                                    {employee?.name ??
                                        payroll.employee_name ??
                                        'N/A'}
                                </div>
                                <div className="text-sm text-slate-500">
                                    {employee?.position ??
                                        'Position unavailable'}
                                </div>
                            </div>
                            <div className="rounded-lg border border-slate-200/70 bg-white/80 p-3">
                                <div className="text-xs tracking-wide text-slate-500 uppercase">
                                    Deductions
                                </div>
                                <div className="text-base font-semibold text-rose-600">
                                    ₱{formatMoney(deductions)}
                                </div>
                                <div className="mt-2 h-2 w-full rounded-full bg-slate-100">
                                    <div
                                        className="h-2 rounded-full bg-rose-400"
                                        style={{ width: `${deductionRate}%` }}
                                    />
                                </div>
                                <div className="mt-1 text-xs text-slate-500">
                                    {deductionRate.toFixed(1)}% of gross pay
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base text-slate-700">
                                Pay Breakdown
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500">
                                    Hourly Rate
                                </span>
                                <span className="font-semibold text-slate-700">
                                    ₱
                                    {formatMoney(
                                        payroll.employee.hourly_rate,
                                    ) ?? 'N/A'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500">Hours</span>
                                <span className="font-semibold text-slate-700">
                                    {payroll.hours_worked ?? 0}
                                </span>
                            </div>
                            <hr />
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500">
                                    Basic Pay
                                </span>
                                <span className="font-semibold text-slate-700">
                                    ₱{formatMoney(basicPay)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500">
                                    Holiday Days
                                </span>
                                <span className="font-semibold text-slate-700">
                                    {payroll.holidays ?? 0}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500">
                                    Gross Pay
                                </span>
                                <span className="font-semibold text-slate-700">
                                    ₱{formatMoney(grossPay)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500">
                                    Deductions
                                </span>
                                <span className="font-semibold text-rose-600">
                                    -₱{formatMoney(deductions)}
                                </span>
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-600">Net Pay</span>
                                <span className="text-base font-semibold text-emerald-700">
                                    ₱{formatMoney(netPay)}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base text-slate-700">
                                Attendance
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 gap-3 text-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-slate-500">
                                    Days Worked
                                </span>
                                <span className="font-semibold text-slate-700">
                                    {payroll.days_worked ?? 0} /{' '}
                                    {payroll.total_days ?? 0}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-slate-500">
                                    Hours Worked
                                </span>
                                <span className="font-semibold text-slate-700">
                                    {payroll.hours_worked ?? 0} /{' '}
                                    {payroll.total_hours ?? 0}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="text-base text-slate-700">
                                Employee Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <Field>
                                    <Label>Name</Label>
                                    <Input
                                        readOnly
                                        value={
                                            employee?.name ??
                                            payroll.employee_name ??
                                            'N/A'
                                        }
                                    />
                                </Field>
                                <Field>
                                    <Label>Department</Label>
                                    <Input
                                        readOnly
                                        value={employee?.department ?? 'N/A'}
                                    />
                                </Field>
                                <Field>
                                    <Label>Position</Label>
                                    <Input
                                        readOnly
                                        value={employee?.position ?? 'N/A'}
                                    />
                                </Field>
                                <Field>
                                    <Label>Employment Type</Label>
                                    <Input
                                        readOnly
                                        value={
                                            employee?.employment_type ?? 'N/A'
                                        }
                                    />
                                </Field>
                                <Field>
                                    <Label>Base Salary</Label>
                                    <Input
                                        readOnly
                                        value={
                                            employee?.base_salary !== null &&
                                            employee?.base_salary !== undefined
                                                ? String(employee.base_salary)
                                                : 'N/A'
                                        }
                                    />
                                </Field>
                                <Field>
                                    <Label>Hourly Rate</Label>
                                    <Input
                                        readOnly
                                        value={
                                            employee?.hourly_rate !== null &&
                                            employee?.hourly_rate !== undefined
                                                ? String(employee.hourly_rate)
                                                : 'N/A'
                                        }
                                    />
                                </Field>
                            </div>
                            {employee?.id && (
                                <div className="mt-4">
                                    <Button variant="outline" asChild>
                                        <Link
                                            href={employeeShow(employee.id).url}
                                        >
                                            View Employee Profile
                                        </Link>
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base text-slate-700">
                                Record Timeline
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <div>
                                <div className="text-slate-500">Created</div>
                                <div className="font-semibold text-slate-700">
                                    {formatDateTime(payroll.created_at)}
                                </div>
                            </div>
                            <div>
                                <div className="text-slate-500">Updated</div>
                                <div className="font-semibold text-slate-700">
                                    {formatDateTime(payroll.updated_at)}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </Container>
        </AppLayout>
    );
}
