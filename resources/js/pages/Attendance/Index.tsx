import AppLayout from '@/layouts/app-layout';
import React, { useMemo, useState } from 'react';
import type { BreadcrumbItem } from '@/types';
import type { EmployeeType } from '../Employees/employeeTypes';
import {
    Container,
    ContainerHeader,
    ContainerHeaderEnd,
} from '@/components/container';
import { Head, router, useForm } from '@inertiajs/react';
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
import { Button } from '@/components/ui/button';
import { Plus, Calendar as CalendarIcon, Trash2 } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface HolidayItem {
    id: number;
    date: string;
    name: string;
    type: 'regular' | 'special_non_working';
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Attendance Management',
        href: '#',
    },
];

const Index = ({
    attendance,
    employees,
    holidays = [],
}: {
    attendance: AttendanceType[];
    employees: Pick<EmployeeType, 'id' | 'name'>[];
    holidays?: HolidayItem[];
}) => {
    const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
    const { data: holidayForm, setData: setHolidayForm, post: postHoliday, processing: isSavingHoliday, reset: resetHolidayForm } = useForm({
        date: '',
        name: '',
        type: 'regular' as 'regular' | 'special_non_working',
    });

    const handleAddHoliday = (e: React.FormEvent) => {
        e.preventDefault();
        postHoliday('/Holidays', {
            onSuccess: () => {
                setIsHolidayModalOpen(false);
                resetHolidayForm();
            },
        });
    };

    const handleDeleteHoliday = (holidayId: number, holidayName: string) => {
        if (confirm(`Remove official holiday '${holidayName}'?`)) {
            router.delete(`/Holidays/${holidayId}`);
        }
    };

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

        const attendanceEvents: EventInput[] = Object.entries(groupedByDate).map(([date, names]) => ({
            id: `att-${date}`,
            start: date,
            allDay: true,
            title: '',
            extendedProps: {
                names: [...names].sort((a, b) => a.localeCompare(b)),
            },
        }));

        const holidayEvents: EventInput[] = (holidays ?? []).map((h) => ({
            id: `holiday-${h.id}`,
            start: h.date,
            allDay: true,
            title: h.name,
            extendedProps: {
                isHoliday: true,
                type: h.type,
                name: h.name,
                id: h.id,
            },
        }));

        return [...holidayEvents, ...attendanceEvents];
    }, [attendance, holidays]);

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
            <Head title="Attendance & Holidays Management" />

            <Container>
                <ContainerHeader>
                    <div className="flex items-center gap-2">
                        <span>Attendance & Holidays Calendar</span>
                        {holidays.length > 0 && (
                            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-300 border border-amber-500/30">
                                {holidays.length} Holidays Registered
                            </span>
                        )}
                    </div>
                    <ContainerHeaderEnd>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsHolidayModalOpen(true)}
                                className="h-9 gap-1.5 font-bold"
                            >
                                <Plus className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                Add Holiday
                            </Button>
                            <ImportAttendance employees={employees} />
                        </div>
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

            {/* Modal Dialog: Register Official Holiday */}
            <Dialog open={isHolidayModalOpen} onOpenChange={setIsHolidayModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-base font-bold">
                            <CalendarIcon className="h-5 w-5 text-amber-500" />
                            Register Official Holiday
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleAddHoliday} className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="holiday_date" className="text-xs font-semibold">
                                Holiday Date *
                            </Label>
                            <Input
                                id="holiday_date"
                                type="date"
                                required
                                value={holidayForm.date}
                                onChange={(e) => setHolidayForm('date', e.target.value)}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="holiday_name" className="text-xs font-semibold">
                                Holiday Name *
                            </Label>
                            <Input
                                id="holiday_name"
                                type="text"
                                required
                                placeholder="e.g. Araw ng Kagitingan"
                                value={holidayForm.name}
                                onChange={(e) => setHolidayForm('name', e.target.value)}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="holiday_type" className="text-xs font-semibold">
                                Holiday Type *
                            </Label>
                            <Select
                                value={holidayForm.type}
                                onValueChange={(val: any) => setHolidayForm('type', val)}
                            >
                                <SelectTrigger className="h-9 text-xs">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="regular">🎉 Regular Holiday (100% Pay Credit)</SelectItem>
                                    <SelectItem value="special_non_working">⭐ Special Non-Working Day</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* List of Registered Holidays with Delete Actions */}
                        {holidays.length > 0 && (
                            <div className="pt-2 border-t border-border">
                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                                    Registered Holidays ({holidays.length})
                                </span>
                                <div className="max-h-36 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
                                    {holidays.map((h) => (
                                        <div
                                            key={h.id}
                                            className="flex items-center justify-between p-2 rounded-md bg-muted/40 border border-border/60 text-xs"
                                        >
                                            <div className="space-y-0.5">
                                                <span className="font-bold text-foreground block">{h.name}</span>
                                                <span className="text-[10px] text-muted-foreground font-mono">
                                                    {h.date} • {h.type === 'regular' ? 'Regular Holiday' : 'Special Holiday'}
                                                </span>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-rose-600 hover:text-rose-700 hover:bg-rose-100 dark:hover:bg-rose-950"
                                                onClick={() => handleDeleteHoliday(h.id, h.name)}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setIsHolidayModalOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" size="sm" disabled={isSavingHoliday} className="font-bold">
                                Save Holiday
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
};

export default Index;
