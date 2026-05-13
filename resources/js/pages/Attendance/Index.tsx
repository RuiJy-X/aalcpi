import AppLayout from '@/layouts/app-layout';
import React, { useMemo } from 'react';
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
import ImportAttendance from './import-attendance';
import AttendanceCalendar from '@/components/attendance/attendance-calendar';
import type { EventInput } from '@fullcalendar/core';

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
    const calendarEvents = useMemo<EventInput[]>(() => {
        const groupedByDate: Record<string, string[]> = {};

        attendance.forEach((record) => {
            if (!record.date || !record.employee_name) {
                return;
            }

            if (!groupedByDate[record.date]) {
                groupedByDate[record.date] = [];
            }

            if (!groupedByDate[record.date].includes(record.employee_name)) {
                groupedByDate[record.date].push(record.employee_name);
            }
        });

        return Object.entries(groupedByDate).map(([date, names]) => ({
            id: date,
            start: date,
            allDay: true,
            title: '',
            extendedProps: {
                names: [...names].sort((a, b) => a.localeCompare(b)),
            },
        }));
    }, [attendance]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Attendance"></Head>

            <Container>
                <ContainerHeader>
                    Attendance Calendar
                    <ContainerHeaderEnd>
                        <ImportAttendance employees={employees} />
                    </ContainerHeaderEnd>
                </ContainerHeader>
                <AttendanceCalendar events={calendarEvents} />
            </Container>

            <Container>
                <ContainerHeader>Attendance Table</ContainerHeader>
                <DataTable data={attendance} columns={attendanceColumns} />
            </Container>
        </AppLayout>
    );
};

export default Index;
