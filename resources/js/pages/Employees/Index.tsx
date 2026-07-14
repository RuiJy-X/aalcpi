import { Head, Link, useForm } from '@inertiajs/react';
import { Briefcase, Plus } from 'lucide-react';
import type { EmployeeType } from './employeeTypes';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import {
    index as employeeIndex,
    show as employeeShow,
    hourlyRateSettings as updateHourlyRateSettings,
} from '@/routes/employees';
import type { BreadcrumbItem } from '@/types';
import {
    ContainerHeader,
    ContainerHeaderEnd,
    Container,
} from '@/components/container';
import { DataTable } from '@/components/data-table/data-table';
import { createEmployeeColumns } from './employee-column-def';
import AddEmployeeDialog from './Create';
import { useMemo, useState } from 'react';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { employeeBulkDelete } from '@/components/data-table/bulk-delete';
import { TableEditToolbar } from '@/components/data-table/table-edit-toolbar';
import { useTableEditMode } from '@/hooks/use-table-edit-mode';
import { bulkUpdate as employeesBulkUpdate } from '@/routes/employees';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Employee Management',
        href: employeeIndex().url,
    },
];

export default function Dashboard({
    employees,
    hourlyRateSettings,
}: {
    employees: EmployeeType[];
    hourlyRateSettings: {
        days_per_month: number;
        hours_per_day: number;
    };
}) {
    const [open, onOpenChange] = useState(false);
    const { data, setData, patch, processing, errors } = useForm({
        days_per_month: String(hourlyRateSettings.days_per_month ?? 24),
        hours_per_day: String(hourlyRateSettings.hours_per_day ?? 8),
    });

    const handleSettingsSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        patch(updateHourlyRateSettings().url, {
            preserveScroll: true,
        });
    };

    const {
        isEditing,
        isSaving,
        startEditing,
        cancelEditing,
        saveEdits,
        handleCellChange,
    } = useTableEditMode({
        rows: employees,
        fields: [
            'employee_code',
            'name',
            'position',
            'department',
            'employment_type',
            'base_salary',
            'hourly_rate',
            'contact_number',
            'address',
            'tin',
        ],
        saveUrl: employeesBulkUpdate().url,
        numericFields: ['base_salary', 'hourly_rate'],
    });

    const employeeColumns = useMemo(
        () =>
            createEmployeeColumns({
                isEditing,
                onCellChange: handleCellChange,
            }),
        [isEditing, handleCellChange],
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Employees">
                <title>Employees</title>
            </Head>

            <Container>
                <ContainerHeader>
                    Employees Table
                    <ContainerHeaderEnd>
                        <TableEditToolbar
                            isEditing={isEditing}
                            isSaving={isSaving}
                            disabled={employees.length === 0}
                            onStart={startEditing}
                            onCancel={cancelEditing}
                            onSave={saveEdits}
                        />
                        <Button
                            onClick={() => onOpenChange(true)}
                            disabled={isEditing}
                        >
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
                    onRowDoubleClick={
                        isEditing
                            ? undefined
                            : (employee) => employeeShow(employee.id).url
                    }
                    bulkDelete={isEditing ? undefined : employeeBulkDelete}
                />
            </Container>
            <Container>
                <ContainerHeader>Hourly Rate Settings</ContainerHeader>
                <form onSubmit={handleSettingsSubmit}>
                    <div className="flex flex-wrap items-end gap-3">
                        <Field>
                            <Label>Days per month</Label>
                            <Input
                                type="number"
                                min="1"
                                step="1"
                                value={data.days_per_month}
                                onChange={(e) =>
                                    setData('days_per_month', e.target.value)
                                }
                            />
                            {errors.days_per_month && (
                                <p className="mt-1 text-xs text-destructive">
                                    {errors.days_per_month}
                                </p>
                            )}
                        </Field>
                        <Field>
                            <Label>Hours per day</Label>
                            <Input
                                type="number"
                                min="0.25"
                                step="0.25"
                                value={data.hours_per_day}
                                onChange={(e) =>
                                    setData('hours_per_day', e.target.value)
                                }
                            />
                            {errors.hours_per_day && (
                                <p className="mt-1 text-xs text-destructive">
                                    {errors.hours_per_day}
                                </p>
                            )}
                        </Field>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Updating...' : 'Update Hourly Rates'}
                        </Button>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                        Updating these values will recalculate all employees'
                        hourly rates based on their base salary.
                    </p>
                </form>
            </Container>
        </AppLayout>
    );
}
