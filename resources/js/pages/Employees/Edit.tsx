import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save, PlusCircle, MinusCircle, Wallet, FileText, BadgeCheck } from 'lucide-react';
import type { FormEventHandler } from 'react';
import AppLayout from '@/layouts/app-layout';
import { index as employeeIndex, show as employeeShow, update as employeeUpdate } from '@/routes/employees';
import type { BreadcrumbItem } from '@/types';
import { Container, ContainerHeader, ContainerHeaderEnd } from '@/components/container';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { EmployeeType } from './employeeTypes';

type EmployeeFormData = Omit<EmployeeType, 'id' | 'created_at' | 'updated_at'>;

export default function EditEmployeePage({
    employee,
}: {
    employee: EmployeeType;
}) {
    const employeeHref = employeeShow(employee.id).url;

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Employee Management',
            href: employeeIndex().url,
        },
        {
            title: employee.name,
            href: employeeHref,
        },
        {
            title: 'Edit Profile & Deductions',
            href: `/Employees/${employee.id}/edit`,
        },
    ];

    const { data, setData, put, processing, errors } = useForm<EmployeeFormData>({
        name: employee.name ?? '',
        employee_code: employee.employee_code ?? '',
        position: employee.position ?? 'Encoder',
        daily_rate: String(employee.daily_rate ?? '0.00'),
        base_salary: String(employee.base_salary ?? '0.00'),
        hourly_rate: String(employee.hourly_rate ?? '0.00'),
        address: employee.address ?? '',
        contact_number: employee.contact_number ?? '',
        tin: employee.tin ?? '',
        sss_no: employee.sss_no ?? '',
        pagibig_no: employee.pagibig_no ?? '',
        philhealth_no: employee.philhealth_no ?? '',
        sss_loan: String(employee.sss_loan ?? '0.00'),
        pagibig_loan: String(employee.pagibig_loan ?? '0.00'),
        emergency_loan: String(employee.emergency_loan ?? '0.00'),
        pagibig_contribution: String(employee.pagibig_contribution ?? '200.00'),
        sss_contribution: String(employee.sss_contribution ?? '0.00'),
        philhealth_contribution: String(employee.philhealth_contribution ?? '0.00'),
        withholding_tax: String(employee.withholding_tax ?? '0.00'),
    });

    const handleDailyRateChange = (rateStr: string) => {
        const rate = parseFloat(rateStr) || 0;
        const daysPerMonth = 24;
        const hoursPerDay = 8;
        const hourly = rate / hoursPerDay;
        const monthly = rate * daysPerMonth;

        setData({
            ...data,
            daily_rate: rateStr,
            hourly_rate: rate > 0 ? hourly.toFixed(2) : '',
            base_salary: rate > 0 ? monthly.toFixed(2) : data.base_salary,
        });
    };

    const handleBaseSalaryChange = (salaryStr: string) => {
        const monthly = parseFloat(salaryStr) || 0;
        const daysPerMonth = 24;
        const hoursPerDay = 8;
        const daily = monthly / daysPerMonth;
        const hourly = daily / hoursPerDay;

        setData({
            ...data,
            base_salary: salaryStr,
            daily_rate: monthly > 0 ? daily.toFixed(2) : data.daily_rate,
            hourly_rate: monthly > 0 ? hourly.toFixed(2) : data.hourly_rate,
        });
    };

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        put(employeeUpdate(employee.id).url);
    };

    // Calculate estimated net pay for quick setup validation preview
    const dailyRateNum = parseFloat(String(data.daily_rate ?? '0')) || 0;
    const estGrossCutoff = dailyRateNum * 12; // 12-day cutoff estimate
    const totalDeductionsCutoff =
        (parseFloat(String(data.sss_loan)) || 0) +
        (parseFloat(String(data.pagibig_contribution)) || 0) +
        (parseFloat(String(data.emergency_loan)) || 0) +
        (parseFloat(String(data.withholding_tax)) || 0);
    const estNetCutoff = Math.max(0, estGrossCutoff - totalDeductionsCutoff);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${employee.name} | Employee Profile`} />

            <form onSubmit={handleSubmit} className="space-y-6">
                <Container>
                    <ContainerHeader>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                Edit Employee Profile & Deductions
                            </h1>
                            <p className="text-sm font-normal text-muted-foreground mt-1">
                                Update profile configuration, daily pay rates, government IDs, and constant loan deductions for {employee.name}.
                            </p>
                        </div>
                        <ContainerHeaderEnd>
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                                <Button variant="outline" asChild>
                                    <Link href={employeeHref}>
                                        <ArrowLeft className="mr-2 h-4 w-4" />
                                        Cancel
                                    </Link>
                                </Button>
                                <Button type="submit" disabled={processing} className="px-6">
                                    <Save className="mr-2 h-4 w-4" />
                                    {processing ? 'Updating...' : 'Save Profile Changes'}
                                </Button>
                            </div>
                        </ContainerHeaderEnd>
                    </ContainerHeader>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 pt-2">
                        {/* Left Main Form Column (8 cols) */}
                        <div className="space-y-6 lg:col-span-8">
                            {/* Section 1: Basic Information */}
                            <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm">
                                <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                                    <FileText className="h-5 w-5 text-primary" />
                                    <h2 className="text-base font-bold text-foreground">
                                        1. Personal & Position Details
                                    </h2>
                                </div>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="employee_code" className="font-semibold">
                                            Employee Code *
                                        </Label>
                                        <Input
                                            id="employee_code"
                                            value={data.employee_code}
                                            readOnly
                                            className="bg-muted/40 text-muted-foreground cursor-not-allowed"
                                        />
                                    </div>

                                    <div className="space-y-1.5 md:col-span-2">
                                        <Label htmlFor="name" className="font-semibold">
                                            Full Name *
                                        </Label>
                                        <Input
                                            id="name"
                                            placeholder="e.g. Juan Dela Cruz"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            disabled={processing}
                                        />
                                        {errors.name && (
                                            <p className="text-xs text-destructive">{errors.name}</p>
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="position" className="font-semibold">
                                            Designation / Position *
                                        </Label>
                                        <Input
                                            id="position"
                                            placeholder="e.g. Encoder"
                                            value={data.position}
                                            onChange={(e) => setData('position', e.target.value)}
                                            disabled={processing}
                                        />
                                        {errors.position && (
                                            <p className="text-xs text-destructive">{errors.position}</p>
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="contact_number">Contact Number</Label>
                                        <Input
                                            id="contact_number"
                                            placeholder="e.g. 09171234567"
                                            value={data.contact_number ?? ''}
                                            onChange={(e) => setData('contact_number', e.target.value)}
                                            disabled={processing}
                                        />
                                    </div>

                                    <div className="space-y-1.5 md:col-span-3">
                                        <Label htmlFor="address">Address</Label>
                                        <Input
                                            id="address"
                                            placeholder="Complete Address"
                                            value={data.address ?? ''}
                                            onChange={(e) => setData('address', e.target.value)}
                                            disabled={processing}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Compensation Setup */}
                            <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm">
                                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                                    <div className="flex items-center gap-2">
                                        <PlusCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                        <h2 className="text-base font-bold text-foreground">
                                            2. Pay Rate & Compensation
                                        </h2>
                                    </div>
                                    <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/60 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                        + Earnings Base
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="daily_rate" className="font-bold text-foreground">
                                            Daily Rate (₱) *
                                        </Label>
                                        <Input
                                            id="daily_rate"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            placeholder="550.00"
                                            value={data.daily_rate}
                                            onChange={(e) => handleDailyRateChange(e.target.value)}
                                            disabled={processing}
                                            className="font-bold text-foreground"
                                        />
                                        <span className="text-xs text-muted-foreground">
                                            Primary pay rate per day worked
                                        </span>
                                        {errors.daily_rate && (
                                            <p className="text-xs text-destructive">{errors.daily_rate}</p>
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="base_salary">Monthly Salary (₱)</Label>
                                        <Input
                                            id="base_salary"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            placeholder="0.00"
                                            value={data.base_salary}
                                            onChange={(e) => handleBaseSalaryChange(e.target.value)}
                                            disabled={processing}
                                        />
                                        <span className="text-xs text-muted-foreground">
                                            Auto-calculated (Daily × 24 days)
                                        </span>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="hourly_rate">Hourly Rate (₱)</Label>
                                        <Input
                                            id="hourly_rate"
                                            type="number"
                                            placeholder="0.00"
                                            value={data.hourly_rate}
                                            readOnly
                                            className="bg-muted/40 text-muted-foreground cursor-not-allowed"
                                        />
                                        <span className="text-xs text-muted-foreground">
                                            Auto-calculated (Daily ÷ 8 hrs)
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: Government Identification */}
                            <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm">
                                <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                                    <BadgeCheck className="h-5 w-5 text-primary" />
                                    <h2 className="text-base font-bold text-foreground">
                                        3. Government Identification Numbers
                                    </h2>
                                </div>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="tin">TIN Number</Label>
                                        <Input
                                            id="tin"
                                            placeholder="000-000-000"
                                            value={data.tin ?? ''}
                                            onChange={(e) => setData('tin', e.target.value)}
                                            disabled={processing}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="sss_no">SSS Number</Label>
                                        <Input
                                            id="sss_no"
                                            placeholder="00-0000000-0"
                                            value={data.sss_no ?? ''}
                                            onChange={(e) => setData('sss_no', e.target.value)}
                                            disabled={processing}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="pagibig_no">Pag-IBIG MID</Label>
                                        <Input
                                            id="pagibig_no"
                                            placeholder="0000-0000-0000"
                                            value={data.pagibig_no ?? ''}
                                            onChange={(e) => setData('pagibig_no', e.target.value)}
                                            disabled={processing}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="philhealth_no">PhilHealth No.</Label>
                                        <Input
                                            id="philhealth_no"
                                            placeholder="00-000000000-0"
                                            value={data.philhealth_no ?? ''}
                                            onChange={(e) => setData('philhealth_no', e.target.value)}
                                            disabled={processing}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Sidebar Column (4 cols) - Deductions & Live Preview Card */}
                        <div className="space-y-6 lg:col-span-4">
                            {/* Section 4 & 5: Constant Deductions Card */}
                            <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm">
                                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                                    <div className="flex items-center gap-2">
                                        <MinusCircle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                                        <h2 className="text-base font-bold text-foreground">
                                            Constant Deductions
                                        </h2>
                                    </div>
                                    <span className="rounded-full bg-rose-100 dark:bg-rose-950/60 px-2.5 py-0.5 text-xs font-bold text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                                        - Payroll Deductions
                                    </span>
                                </div>

                                <div className="space-y-4">
                                    <p className="text-xs text-muted-foreground">
                                        These loan amortizations and statutory contributions are deducted automatically every payroll cutoff.
                                    </p>

                                    <div className="grid grid-cols-1 gap-3">
                                        <div className="space-y-1">
                                            <Label htmlFor="sss_loan" className="text-xs font-semibold text-foreground">
                                                SSS Loan (₱)
                                            </Label>
                                            <Input
                                                id="sss_loan"
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                placeholder="0.00"
                                                value={data.sss_loan ?? '0.00'}
                                                onChange={(e) => setData('sss_loan', e.target.value)}
                                                disabled={processing}
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <Label htmlFor="pagibig_contribution" className="text-xs font-semibold text-foreground">
                                                Pag-IBIG Contribution (₱)
                                            </Label>
                                            <Input
                                                id="pagibig_contribution"
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={data.pagibig_contribution ?? '200.00'}
                                                onChange={(e) => setData('pagibig_contribution', e.target.value)}
                                                disabled={processing}
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <Label htmlFor="emergency_loan" className="text-xs font-semibold text-foreground">
                                                Emergency Loan (₱)
                                            </Label>
                                            <Input
                                                id="emergency_loan"
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                placeholder="0.00"
                                                value={data.emergency_loan ?? '0.00'}
                                                onChange={(e) => setData('emergency_loan', e.target.value)}
                                                disabled={processing}
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <Label htmlFor="withholding_tax" className="text-xs font-semibold text-foreground">
                                                Tax W/Held (₱)
                                            </Label>
                                            <Input
                                                id="withholding_tax"
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                placeholder="0.00"
                                                value={data.withholding_tax ?? '0.00'}
                                                onChange={(e) => setData('withholding_tax', e.target.value)}
                                                disabled={processing}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Live Cutoff Preview Card */}
                            <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 space-y-3">
                                <div className="flex items-center gap-2">
                                    <Wallet className="h-5 w-5 text-primary" />
                                    <h3 className="text-sm font-bold text-foreground">
                                        Estimated 12-Day Cutoff Preview
                                    </h3>
                                </div>
                                <div className="space-y-2 text-sm pt-1">
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>Est. Gross (12 Days):</span>
                                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                            + ₱{estGrossCutoff.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>Total Deductions:</span>
                                        <span className="font-semibold text-rose-600 dark:text-rose-400">
                                            - ₱{totalDeductionsCutoff.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    <div className="border-t border-border/80 pt-2 flex justify-between font-bold text-foreground text-base">
                                        <span>Est. Net Amount:</span>
                                        <span className="text-primary">
                                            ₱{estNetCutoff.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Container>
            </form>
        </AppLayout>
    );
}
