import { Head, Link } from '@inertiajs/react';
import type { EmployeeType } from './employeeTypes';
import AppLayout from '@/layouts/app-layout';
import { index as employeeIndex } from '@/routes/Employees';
import { show as employeeShow } from '@/routes/Employees';
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
    if (!value) {
        return 'NA';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return 'NA';
    }

    return date.toLocaleString();
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

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Employee Management',
            href: employeeIndex().url,
        },
        {
            title: 'Employee Details',
            href: employeeHref,
        },
        {
            title: employee.name,
            href: employeeHref,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${employee.name} | Employee Details`} />

            <Container>
                <ContainerHeader>
                    Employee Details
                    <ContainerHeaderEnd>
                        <Button variant="outline" asChild>
                            <Link href={employeeIndex().url}>Back to list</Link>
                        </Button>
                    </ContainerHeaderEnd>
                </ContainerHeader>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <Field>
                        <Label>Name</Label>
                        <Input readOnly value={employee.name ?? 'NA'} />
                    </Field>

                    <Field>
                        <Label>Position</Label>
                        <Input readOnly value={employee.position ?? 'NA'} />
                    </Field>

                    <Field>
                        <Label>Department</Label>
                        <Input readOnly value={employee.department ?? 'NA'} />
                    </Field>

                    <Field>
                        <Label>Employment Type</Label>
                        <Input
                            readOnly
                            value={employee.employment_type ?? 'NA'}
                        />
                    </Field>

                    <Field>
                        <Label>Base Salary</Label>
                        <Input
                            readOnly
                            value={String(employee.base_salary ?? 'NA')}
                        />
                    </Field>

                    <Field>
                        <Label>Hourly Rate</Label>
                        <Input
                            readOnly
                            value={String(employee.hourly_rate ?? 'NA')}
                        />
                    </Field>

                    <Field>
                        <Label>Contact Number</Label>
                        <Input
                            readOnly
                            value={employee.contact_number ?? 'NA'}
                        />
                    </Field>

                    <Field>
                        <Label>TIN</Label>
                        <Input readOnly value={employee.tin ?? 'NA'} />
                    </Field>

                    <Field className="md:col-span-2 xl:col-span-3">
                        <Label>Address</Label>
                        <Input readOnly value={employee.address ?? 'NA'} />
                    </Field>

                    <Field>
                        <Label>Created At</Label>
                        <Input
                            readOnly
                            value={formatDateTime(employee.created_at)}
                        />
                    </Field>

                    <Field>
                        <Label>Updated At</Label>
                        <Input
                            readOnly
                            value={formatDateTime(employee.updated_at)}
                        />
                    </Field>
                </div>
            </Container>

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
