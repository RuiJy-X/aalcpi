import { Head, Link, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    Save,
    PlusCircle,
    MinusCircle,
    Wallet,
    FileText,
    BadgeCheck,
    ShieldAlert,
} from 'lucide-react';
import type { FormEventHandler } from 'react';
import AppLayout from '@/layouts/app-layout';
import {
    index as employeeIndex,
    store as employeeStore,
    create as employeeCreate,
} from '@/routes/employees';
import type { BreadcrumbItem } from '@/types';
import {
    Container,
    ContainerHeader,
    ContainerHeaderEnd,
} from '@/components/container';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { EmployeeType } from './employeeTypes';

type EmployeeFormData = Omit<EmployeeType, 'id' | 'created_at' | 'updated_at'>;

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Employee Management',
        href: employeeIndex().url,
    },
    {
        title: 'New Employee Profile Setup',
        href: employeeCreate().url,
    },
];

export default function CreateEmployeePage() {
    const { data, setData, post, processing, errors } =
        useForm<EmployeeFormData>({
            name: '',
            employee_code: '',
            position: 'Encoder',
            daily_rate: '',
            base_salary: '',
            hourly_rate: '',
            address: '',
            contact_number: '',
            tin: '',
            sss_no: '',
            pagibig_no: '',
            philhealth_no: '',
            sss_loan: '0.00',
            pagibig_loan: '0.00',
            emergency_loan: '0.00',
            pagibig_contribution: '200.00',
            sss_contribution: '0.00',
            philhealth_contribution: '0.00',
            withholding_tax: '0.00',
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
        post(employeeStore.url());
    };

    // Calculate estimated net pay for quick setup validation preview
    const dailyRateNum = parseFloat(String(data.daily_rate ?? '0')) || 0;
    const estGrossCutoff = dailyRateNum * 12; // 12-day cutoff estimate
    const totalDeductionsCutoff =
        (parseFloat(String(data.sss_loan)) || 0) +
        (parseFloat(String(data.emergency_loan)) || 0) +
        (parseFloat(String(data.pagibig_contribution)) || 0) +
        (parseFloat(String(data.withholding_tax)) || 0);
    const estNetCutoff = Math.max(0, estGrossCutoff - totalDeductionsCutoff);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="New Employee Profile Setup" />

            <form onSubmit={handleSubmit} className="space-y-6">
                <Container>
                    <ContainerHeader>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                Employee Profile & Payroll Setup
                            </h1>
                            <p className="mt-1 text-sm font-normal text-muted-foreground">
                                Create an employee record with daily pay rate,
                                government identification, and constant loan
                                deductions.
                            </p>
                        </div>
                        <ContainerHeaderEnd>
                            <div className="mt-2 flex w-full flex-wrap items-center gap-2 sm:mt-0 sm:w-auto sm:gap-3">
                                <Button variant="outline" asChild>
                                    <Link href={employeeIndex().url}>
                                        <ArrowLeft className="mr-2 h-4 w-4" />
                                        Cancel
                                    </Link>
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="px-6"
                                >
                                    <Save className="mr-2 h-4 w-4" />
                                    {processing
                                        ? 'Saving Profile...'
                                        : 'Save Profile Setup'}
                                </Button>
                            </div>
                        </ContainerHeaderEnd>
                    </ContainerHeader>

                    <div className="grid grid-cols-1 gap-6 pt-2 lg:grid-cols-12">
                        {/* Left Main Form Column (8 cols) */}
                        <div className="space-y-6 lg:col-span-8">
                            {/* Section 1: Basic Information */}
                            <div className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm">
                                <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                                    <FileText className="h-5 w-5 text-primary" />
                                    <h2 className="text-base font-bold text-foreground">
                                        1. Personal & Position Details
                                    </h2>
                                </div>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <div className="space-y-1.5">
                                        <Label
                                            htmlFor="employee_code"
                                            className="font-semibold"
                                        >
                                            Employee Code *
                                        </Label>
                                        <Input
                                            id="employee_code"
                                            placeholder="e.g. EMP-001"
                                            value={data.employee_code}
                                            onChange={(e) =>
                                                setData(
                                                    'employee_code',
                                                    e.target.value,
                                                )
                                            }
                                            disabled={processing}
                                        />
                                        {errors.employee_code && (
                                            <p className="text-xs text-destructive">
                                                {errors.employee_code}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-1.5 md:col-span-2">
                                        <Label
                                            htmlFor="name"
                                            className="font-semibold"
                                        >
                                            Full Name *
                                        </Label>
                                        <Input
                                            id="name"
                                            placeholder="e.g. Juan Dela Cruz"
                                            value={data.name}
                                            onChange={(e) =>
                                                setData('name', e.target.value)
                                            }
                                            disabled={processing}
                                        />
                                        {errors.name && (
                                            <p className="text-xs text-destructive">
                                                {errors.name}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label
                                            htmlFor="position"
                                            className="font-semibold"
                                        >
                                            Designation / Position *
                                        </Label>
                                        <Input
                                            id="position"
                                            placeholder="e.g. Encoder"
                                            value={data.position}
                                            onChange={(e) =>
                                                setData(
                                                    'position',
                                                    e.target.value,
                                                )
                                            }
                                            disabled={processing}
                                        />
                                        {errors.position && (
                                            <p className="text-xs text-destructive">
                                                {errors.position}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="contact_number">
                                            Contact Number
                                        </Label>
                                        <Input
                                            id="contact_number"
                                            placeholder="e.g. 09171234567"
                                            value={data.contact_number ?? ''}
                                            onChange={(e) =>
                                                setData(
                                                    'contact_number',
                                                    e.target.value,
                                                )
                                            }
                                            disabled={processing}
                                        />
                                    </div>

                                    <div className="space-y-1.5 md:col-span-3">
                                        <Label htmlFor="address">Address</Label>
                                        <Input
                                            id="address"
                                            placeholder="Complete Address"
                                            value={data.address ?? ''}
                                            onChange={(e) =>
                                                setData(
                                                    'address',
                                                    e.target.value,
                                                )
                                            }
                                            disabled={processing}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Compensation Setup */}
                            <div className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm">
                                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                                    <div className="flex items-center gap-2">
                                        <PlusCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                        <h2 className="text-base font-bold text-foreground">
                                            2. Pay Rate & Compensation
                                        </h2>
                                    </div>
                                    <span className="rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                        + Earnings Base
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <div className="space-y-1.5">
                                        <Label
                                            htmlFor="daily_rate"
                                            className="font-bold text-foreground"
                                        >
                                            Daily Rate (₱) *
                                        </Label>
                                        <Input
                                            id="daily_rate"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            placeholder="550.00"
                                            value={data.daily_rate}
                                            onChange={(e) =>
                                                handleDailyRateChange(
                                                    e.target.value,
                                                )
                                            }
                                            disabled={processing}
                                            className="font-bold text-foreground"
                                        />
                                        <span className="text-xs text-muted-foreground">
                                            Primary pay rate per day worked
                                        </span>
                                        {errors.daily_rate && (
                                            <p className="text-xs text-destructive">
                                                {errors.daily_rate}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="base_salary">
                                            Monthly Salary (₱)
                                        </Label>
                                        <Input
                                            id="base_salary"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            placeholder="0.00"
                                            value={data.base_salary}
                                            onChange={(e) =>
                                                handleBaseSalaryChange(
                                                    e.target.value,
                                                )
                                            }
                                            disabled={processing}
                                        />
                                        <span className="text-xs text-muted-foreground">
                                            Auto-calculated (Daily × 24 days)
                                        </span>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="hourly_rate">
                                            Hourly Rate (₱)
                                        </Label>
                                        <Input
                                            id="hourly_rate"
                                            type="number"
                                            placeholder="0.00"
                                            value={data.hourly_rate}
                                            readOnly
                                            className="cursor-not-allowed bg-muted/40 text-muted-foreground"
                                        />
                                        <span className="text-xs text-muted-foreground">
                                            Auto-calculated (Daily ÷ 8 hrs)
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: Government Identification */}
                            <div className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm">
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
                                            onChange={(e) =>
                                                setData('tin', e.target.value)
                                            }
                                            disabled={processing}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="sss_no">
                                            SSS Number
                                        </Label>
                                        <Input
                                            id="sss_no"
                                            placeholder="00-0000000-0"
                                            value={data.sss_no ?? ''}
                                            onChange={(e) =>
                                                setData(
                                                    'sss_no',
                                                    e.target.value,
                                                )
                                            }
                                            disabled={processing}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="pagibig_no">
                                            Pag-IBIG MID
                                        </Label>
                                        <Input
                                            id="pagibig_no"
                                            placeholder="0000-0000-0000"
                                            value={data.pagibig_no ?? ''}
                                            onChange={(e) =>
                                                setData(
                                                    'pagibig_no',
                                                    e.target.value,
                                                )
                                            }
                                            disabled={processing}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="philhealth_no">
                                            PhilHealth No.
                                        </Label>
                                        <Input
                                            id="philhealth_no"
                                            placeholder="00-000000000-0"
                                            value={data.philhealth_no ?? ''}
                                            onChange={(e) =>
                                                setData(
                                                    'philhealth_no',
                                                    e.target.value,
                                                )
                                            }
                                            disabled={processing}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Sidebar Column (4 cols) - Deductions & Live Preview Card */}
                        <div className="space-y-6 lg:col-span-4">
                            {/* Section 4 & 5: Constant Deductions Card */}
                            <div className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm">
                                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                                    <div className="flex items-center gap-2">
                                        <MinusCircle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                                        <h2 className="text-base font-bold text-foreground">
                                            Constant Deductions
                                        </h2>
                                    </div>
                                    <span className="rounded-full border border-rose-200 bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-700 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                                        - Payroll Deductions
                                    </span>
                                </div>

                                <div className="space-y-4">
                                    <p className="text-xs text-muted-foreground">
                                        These loan amortizations and statutory
                                        contributions are deducted automatically
                                        every payroll cutoff.
                                    </p>

                                    <div className="space-y-3">
                                        <div className="space-y-1">
                                            <Label
                                                htmlFor="sss_loan"
                                                className="text-xs font-semibold text-foreground"
                                            >
                                                SSS Loan Deduction (₱)
                                            </Label>
                                            <Input
                                                id="sss_loan"
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                placeholder="0.00"
                                                value={data.sss_loan ?? '0.00'}
                                                onChange={(e) =>
                                                    setData(
                                                        'sss_loan',
                                                        e.target.value,
                                                    )
                                                }
                                                disabled={processing}
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <Label
                                                htmlFor="emergency_loan"
                                                className="text-xs font-semibold text-foreground"
                                            >
                                                Emergency Loan Deduction (₱)
                                            </Label>
                                            <Input
                                                id="emergency_loan"
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                placeholder="0.00"
                                                value={
                                                    data.emergency_loan ??
                                                    '0.00'
                                                }
                                                onChange={(e) =>
                                                    setData(
                                                        'emergency_loan',
                                                        e.target.value,
                                                    )
                                                }
                                                disabled={processing}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 border-t border-border/60 pt-2">
                                            <div className="space-y-1">
                                                <Label
                                                    htmlFor="pagibig_contribution"
                                                    className="text-xs font-medium"
                                                >
                                                    Pag-IBIG (₱)
                                                </Label>
                                                <Input
                                                    id="pagibig_contribution"
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={
                                                        data.pagibig_contribution ??
                                                        '200.00'
                                                    }
                                                    onChange={(e) =>
                                                        setData(
                                                            'pagibig_contribution',
                                                            e.target.value,
                                                        )
                                                    }
                                                    disabled={processing}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label
                                                    htmlFor="sss_contribution"
                                                    className="text-xs font-medium"
                                                >
                                                    SSS (₱)
                                                </Label>
                                                <Input
                                                    id="sss_contribution"
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    placeholder="0.00"
                                                    value={
                                                        data.sss_contribution ??
                                                        '0.00'
                                                    }
                                                    onChange={(e) =>
                                                        setData(
                                                            'sss_contribution',
                                                            e.target.value,
                                                        )
                                                    }
                                                    disabled={processing}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label
                                                    htmlFor="philhealth_contribution"
                                                    className="text-xs font-medium"
                                                >
                                                    PhilHealth (₱)
                                                </Label>
                                                <Input
                                                    id="philhealth_contribution"
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    placeholder="0.00"
                                                    value={
                                                        data.philhealth_contribution ??
                                                        '0.00'
                                                    }
                                                    onChange={(e) =>
                                                        setData(
                                                            'philhealth_contribution',
                                                            e.target.value,
                                                        )
                                                    }
                                                    disabled={processing}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label
                                                    htmlFor="withholding_tax"
                                                    className="text-xs font-medium"
                                                >
                                                    Tax W/Held (₱)
                                                </Label>
                                                <Input
                                                    id="withholding_tax"
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    placeholder="0.00"
                                                    value={
                                                        data.withholding_tax ??
                                                        '0.00'
                                                    }
                                                    onChange={(e) =>
                                                        setData(
                                                            'withholding_tax',
                                                            e.target.value,
                                                        )
                                                    }
                                                    disabled={processing}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Live Cutoff Preview Card */}
                            <div className="space-y-3 rounded-xl border border-primary/30 bg-primary/5 p-5">
                                <div className="flex items-center gap-2">
                                    <Wallet className="h-5 w-5 text-primary" />
                                    <h3 className="text-sm font-bold text-foreground">
                                        Estimated 12-Day Cutoff Preview
                                    </h3>
                                </div>
                                <div className="space-y-2 pt-1 text-sm">
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>Est. Gross (12 Days):</span>
                                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                            + ₱
                                            {estGrossCutoff.toLocaleString(
                                                'en-PH',
                                                { minimumFractionDigits: 2 },
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-muted-foreground">
                                        <span>Total Deductions:</span>
                                        <span className="font-semibold text-rose-600 dark:text-rose-400">
                                            - ₱
                                            {totalDeductionsCutoff.toLocaleString(
                                                'en-PH',
                                                { minimumFractionDigits: 2 },
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex justify-between border-t border-border/80 pt-2 text-base font-bold text-foreground">
                                        <span>Est. Net Amount:</span>
                                        <span className="text-primary">
                                            ₱
                                            {estNetCutoff.toLocaleString(
                                                'en-PH',
                                                { minimumFractionDigits: 2 },
                                            )}
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
