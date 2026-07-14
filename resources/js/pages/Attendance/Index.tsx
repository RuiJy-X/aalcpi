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
import { createAttendanceColumns } from './attendance-column-def';
import { attendanceBulkDelete } from '@/components/data-table/bulk-delete';
import { TableEditToolbar } from '@/components/data-table/table-edit-toolbar';
import { useTableEditMode } from '@/hooks/use-table-edit-mode';
import { bulkUpdate as attendanceBulkUpdate } from '@/routes/attendance';

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

    const {
        isEditing,
        isSaving,
        startEditing,
        cancelEditing,
        saveEdits,
        handleCellChange,
    } = useTableEditMode({
        rows: attendance,
        fields: ['date', 'time_in', 'time_out', 'times', 'working_time'],
        saveUrl: attendanceBulkUpdate().url,
    });

    const attendanceColumns = useMemo(
        () =>
            createAttendanceColumns({
                isEditing,
                onCellChange: handleCellChange,
            }),
        [isEditing, handleCellChange],
    );

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
                <ContainerHeader>
                    Attendance Table
                    <ContainerHeaderEnd>
                        <TableEditToolbar
                            isEditing={isEditing}
                            isSaving={isSaving}
                            disabled={attendance.length === 0}
                            onStart={startEditing}
                            onCancel={cancelEditing}
                            onSave={saveEdits}
                        />
                    </ContainerHeaderEnd>
                </ContainerHeader>
                <DataTable
                    data={attendance}
                    columns={attendanceColumns}
                    bulkDelete={isEditing ? undefined : attendanceBulkDelete}
                />
            </Container>
        </AppLayout>
    );
};

export default Index;
