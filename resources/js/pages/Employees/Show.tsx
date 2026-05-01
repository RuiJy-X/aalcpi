import { Head, Link } from '@inertiajs/react';
import type { EmployeeType } from './employeeTypes';
import AppLayout from '@/layouts/app-layout';
import { index as employeeIndex } from '@/routes/Employees';
import { show as employeeShow } from '@/routes/Employees';
import type { BreadcrumbItem } from '@/types';
import {
    Container,
    ContainerHeader,
    ContainerHeaderEnd,
} from '@/components/container';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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

export default function Show({ employee }: { employee: EmployeeType }) {
    const employeeHref = employeeShow(employee.id).url;

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
        </AppLayout>
    );
}
