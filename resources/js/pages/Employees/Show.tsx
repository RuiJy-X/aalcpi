import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import type { EmployeeType } from './employeeTypes';
import AppLayout from '@/layouts/app-layout';
import {
    index as employeeIndex,
    show as employeeShow,
    update as employeeUpdate,
} from '@/actions/App/Http/Controllers/EmployeeController';
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
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { AttendanceType } from '../Attendance/attendance-types';
import { attendanceColumns } from '../Attendance/attendance-column-def';
import type { PayrollType } from '../Payroll/payroll-types';
import { payrollColumns } from '../Payroll/payroll-column-def';

function formatDateTime(value?: string | null) {
    if (!value) return 'NA';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'NA';
    return date.toLocaleString();
}

function formatCurrency(value?: string | number | null) {
    if (value === null || value === undefined || value === '') return 'NA';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return 'NA';
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
    }).format(num);
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
    icon,
}: {
    label: string;
    value?: string | null;
    icon?: React.ReactNode;
}) {
    return (
        <div className="flex items-start gap-3 border-b border-border/50 py-3 last:border-0">
            {icon && (
                <span className="mt-0.5 shrink-0 text-muted-foreground">
                    {icon}
                </span>
            )}
            <div className="min-w-0 flex-1">
                <p className="mb-0.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    {label}
                </p>
                <p className="text-sm break-words text-foreground">
                    {value || 'Not provided'}
                </p>
            </div>
        </div>
    );
}

function EditField({
    label,
    value,
    onChange,
    error,
    readOnly = false,
}: {
    label: string;
    value: string;
    onChange?: (v: string) => void;
    error?: string;
    readOnly?: boolean;
}) {
    return (
        <Field>
            <Label>{label}</Label>
            <Input
                readOnly={readOnly}
                value={value}
                onChange={(e) => onChange?.(e.target.value)}
                className={readOnly ? 'cursor-default bg-muted/40' : ''}
            />
            {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
        </Field>
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
}) {
    const employeeHref = employeeShow(employee.id).url;
    const attendanceRecords = attendance ?? [];
    const payrollRecords = payrolls ?? [];
    const [isEditing, setIsEditing] = useState(false);

    const { data, setData, put, processing, errors, reset } = useForm({
        name: employee.name ?? '',
        employee_code: employee.employee_code ?? '',
        position: employee.position ?? '',
        employment_type: employee.employment_type ?? '',
        department: employee.department ?? '',
        base_salary: String(employee.base_salary ?? ''),
        hourly_rate: String(employee.hourly_rate ?? ''),
        contact_number: employee.contact_number ?? '',
        tin: employee.tin ?? '',
        address: employee.address ?? '',
    });

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Employee Management', href: employeeIndex().url },
        { title: 'Employee Details', href: employeeHref },
        { title: employee.name, href: employeeHref },
    ];

    function handleEdit() {
        setIsEditing(true);
    }

    function handleCancel() {
        reset();
        setIsEditing(false);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        put(employeeUpdate(employee.id).url, {
            onSuccess: () => setIsEditing(false),
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${employee.name} | Employee Details`} />

            <form onSubmit={handleSubmit}>
                <Container>
                    <ContainerHeader>
                        Employee Details
                        <ContainerHeaderEnd>
                            <div className="flex items-center gap-2">
                                {!isEditing ? (
                                    <>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={handleEdit}
                                        >
                                            Edit
                                        </Button>
                                        <Button variant="outline" asChild>
                                            <Link href={employeeIndex().url}>
                                                Back to list
                                            </Link>
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={handleCancel}
                                            disabled={processing}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={processing}
                                        >
                                            {processing
                                                ? 'Saving...'
                                                : 'Save Changes'}
                                        </Button>
                                    </>
                                )}
                            </div>
                        </ContainerHeaderEnd>
                    </ContainerHeader>
                    {/* ── VIEW MODE ── */}
                    {!isEditing && (
                        <div className="space-y-6">
                            <div className="flex flex-col items-start gap-4 rounded-xl border border-border/50 bg-muted/40 p-5 sm:flex-row sm:items-center">
                                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl font-semibold text-primary">
                                    {getInitials(employee.name ?? '?')}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h2 className="truncate text-xl font-semibold">
                                        {employee.name}
                                    </h2>
                                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                        {employee.position && (
                                            <span className="text-sm text-muted-foreground">
                                                {employee.position}
                                            </span>
                                        )}
                                        {employee.position &&
                                            employee.department && (
                                                <span className="text-muted-foreground/40">
                                                    ·
                                                </span>
                                            )}
                                        {employee.department && (
                                            <span className="text-sm text-muted-foreground">
                                                {employee.department}
                                            </span>
                                        )}
                                    </div>
                                    <div className="mt-2.5 flex flex-wrap gap-2">
                                        {employee.employment_type && (
                                            <Badge variant="secondary">
                                                {employee.employment_type}
                                            </Badge>
                                        )}
                                        {employee.employee_code && (
                                            <Badge
                                                variant="outline"
                                                className="font-mono text-xs"
                                            >
                                                {employee.employee_code}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                                <div className="flex shrink-0 gap-4 sm:flex-col sm:gap-1 sm:text-right">
                                    <div>
                                        <p className="text-xs tracking-wide text-muted-foreground uppercase">
                                            Base salary
                                        </p>
                                        <p className="text-base font-semibold tabular-nums">
                                            {formatCurrency(
                                                employee.base_salary,
                                            )}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs tracking-wide text-muted-foreground uppercase">
                                            Hourly rate
                                        </p>
                                        <p className="text-base font-semibold tabular-nums">
                                            {formatCurrency(
                                                employee.hourly_rate,
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="rounded-xl border border-border/50 px-4 py-2">
                                    <p className="pt-2 pb-1 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                                        Contact information
                                    </p>
                                    <DetailRow
                                        label="Contact number"
                                        value={employee.contact_number}
                                        icon={
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="15"
                                                height="15"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="1.75"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.39 2 2 0 0 1 3.6 1.2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                                            </svg>
                                        }
                                    />
                                    <DetailRow
                                        label="Address"
                                        value={employee.address}
                                        icon={
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="15"
                                                height="15"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="1.75"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                                                <circle cx="12" cy="10" r="3" />
                                            </svg>
                                        }
                                    />
                                </div>

                                <div className="rounded-xl border border-border/50 px-4 py-2">
                                    <p className="pt-2 pb-1 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                                        Tax & compliance
                                    </p>
                                    <DetailRow
                                        label="TIN"
                                        value={employee.tin}
                                        icon={
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="15"
                                                height="15"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="1.75"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                <rect
                                                    width="20"
                                                    height="14"
                                                    x="2"
                                                    y="5"
                                                    rx="2"
                                                />
                                                <line
                                                    x1="2"
                                                    x2="22"
                                                    y1="10"
                                                    y2="10"
                                                />
                                            </svg>
                                        }
                                    />
                                    <DetailRow
                                        label="Created at"
                                        value={formatDateTime(
                                            employee.created_at,
                                        )}
                                        icon={
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="15"
                                                height="15"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="1.75"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                <circle
                                                    cx="12"
                                                    cy="12"
                                                    r="10"
                                                />
                                                <polyline points="12 6 12 12 16 14" />
                                            </svg>
                                        }
                                    />
                                    <DetailRow
                                        label="Last updated"
                                        value={formatDateTime(
                                            employee.updated_at,
                                        )}
                                        icon={
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="15"
                                                height="15"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="1.75"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                                                <path d="M21 3v5h-5" />
                                            </svg>
                                        }
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── EDIT MODE ── */}
                    {isEditing && (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                            <EditField
                                label="Name"
                                value={data.name}
                                onChange={(v) => setData('name', v)}
                                error={errors.name}
                            />
                            <EditField
                                label="Position"
                                value={data.position}
                                onChange={(v) => setData('position', v)}
                                error={errors.position}
                            />
                            <EditField
                                label="Department"
                                value={data.department}
                                onChange={(v) => setData('department', v)}
                                error={errors.department}
                            />
                            <EditField
                                label="Employment type"
                                value={data.employment_type}
                                onChange={(v) => setData('employment_type', v)}
                                error={errors.employment_type}
                            />
                            <EditField
                                label="Base salary"
                                value={data.base_salary}
                                onChange={(v) => setData('base_salary', v)}
                                error={errors.base_salary}
                            />
                            <EditField
                                label="Hourly rate"
                                value={data.hourly_rate}
                                readOnly
                            />
                            <EditField
                                label="Contact number"
                                value={data.contact_number}
                                onChange={(v) => setData('contact_number', v)}
                                error={errors.contact_number}
                            />
                            <EditField
                                label="TIN"
                                value={data.tin}
                                onChange={(v) => setData('tin', v)}
                                error={errors.tin}
                            />
                            <Field className="md:col-span-2 xl:col-span-3">
                                <Label>Address</Label>
                                <Input
                                    value={data.address}
                                    onChange={(e) =>
                                        setData('address', e.target.value)
                                    }
                                />
                                {errors.address && (
                                    <p className="mt-1 text-xs text-destructive">
                                        {errors.address}
                                    </p>
                                )}
                            </Field>
                            <EditField
                                label="Created at"
                                value={formatDateTime(employee.created_at)}
                                readOnly
                            />
                            <EditField
                                label="Last updated"
                                value={formatDateTime(employee.updated_at)}
                                readOnly
                            />
                        </div>
                    )}
                </Container>
            </form>

            <Container>
                <ContainerHeader>
                    Attendance & Payroll
                    <ContainerHeaderEnd>
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary">
                                Attendance {attendanceRecords.length}
                            </Badge>
                            <Badge variant="secondary">
                                Payrolls {payrollRecords.length}
                            </Badge>
                        </div>
                    </ContainerHeaderEnd>
                </ContainerHeader>

                <Tabs defaultValue="attendance" className="w-full">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <TabsList variant="line">
                            <TabsTrigger value="attendance" className="gap-2">
                                Attendance
                                <Badge variant="outline">
                                    {attendanceRecords.length}
                                </Badge>
                            </TabsTrigger>
                            <TabsTrigger value="payroll" className="gap-2">
                                Payroll
                                <Badge variant="outline">
                                    {payrollRecords.length}
                                </Badge>
                            </TabsTrigger>
                        </TabsList>
                        <p className="text-sm text-muted-foreground">
                            {payrollRecords.length > 0
                                ? 'Double-click a payroll row to view details.'
                                : 'No payroll records available yet.'}
                        </p>
                    </div>

                    <TabsContent value="attendance" className="mt-4">
                        <DataTable
                            data={attendanceRecords}
                            columns={attendanceColumns}
                        />
                    </TabsContent>

                    <TabsContent value="payroll" className="mt-4">
                        <DataTable
                            data={payrollRecords}
                            columns={payrollColumns}
                            onRowDoubleClick={(row) => payrollShow(row.id).url}
                        />
                    </TabsContent>
                </Tabs>
            </Container>
        </AppLayout>
    );
}
