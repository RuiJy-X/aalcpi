import { Head, Link } from '@inertiajs/react';
import { Briefcase, Plus } from 'lucide-react';
import type { EmployeeType } from './employeeTypes';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { index as employeeIndex } from '@/routes/Employees';
import { show as employeeShow } from '@/routes/Employees';
import type { BreadcrumbItem } from '@/types';
import {
    ContainerHeader,
    ContainerHeaderEnd,
    Container,
} from '@/components/container';
import { DataTable } from '@/components/data-table/data-table';
import { employeeColumns } from './employee-column-def';
import AddEmployeeDialog from './Create';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Employee Management',
        href: employeeIndex().url,
    },
];

export default function Dashboard({
    employees,
}: {
    employees: EmployeeType[];
}) {
    const [open, onOpenChange] = useState(false);
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Employees">
                <title>Employees</title>
            </Head>

            <Container>
                <ContainerHeader>
                    Employees Table
                    <ContainerHeaderEnd>
                        <Button onClick={() => onOpenChange(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Employee
                        </Button>
                        <AddEmployeeDialog
                            open={open}
                            onOpenChange={onOpenChange}
                        />
                    </ContainerHeaderEnd>
                </ContainerHeader>
                <DataTable
                    columns={employeeColumns}
                    data={employees}
                    onRowDoubleClick={(employee) =>
                        employeeShow(employee.id).url
                    }
                />
            </Container>
        </AppLayout>
    );
}
