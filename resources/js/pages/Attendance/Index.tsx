import AppLayout from '@/layouts/app-layout';
import React from 'react';
import type { BreadcrumbItem } from '@/types';
import type { EmployeeType } from '../Employees/employeeTypes';
import {
    Container,
    ContainerHeader,
    ContainerHeaderEnd,
} from '@/components/container';
import { Head } from '@inertiajs/react';
import { AttendanceType } from './attendance-types';
import { attendanceColumns } from './attendance-column-def';

import { DataTable } from '@/components/data-table/data-table';
import { Dialog } from '@/components/ui/dialog';
import ImportAttendance from './import-attendance';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Attendance Management',
        href: '#',
    },
];

const Index = ({
    attendance,
    employees,
}: {
    attendance: AttendanceType[];
    employees: Pick<EmployeeType, 'id' | 'name'>[];
}) => {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Attendance"></Head>

            <Container>
                <ContainerHeader>
                    Attendance Table
                    <ContainerHeaderEnd>
                        <ImportAttendance employees={employees} />
                    </ContainerHeaderEnd>
                </ContainerHeader>
                <DataTable data={attendance} columns={attendanceColumns} />
            </Container>
        </AppLayout>
    );
};

export default Index;
