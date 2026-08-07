import { Head, Link, useForm } from '@inertiajs/react';
import { Plus, Users, Settings2 } from 'lucide-react';
import type { EmployeeType } from './employeeTypes';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import {
    index as employeeIndex,
    show as employeeShow,
    create as employeeCreate,
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
import { useMemo } from 'react';
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
            'daily_rate',
            'base_salary',
            'hourly_rate',
            'sss_loan',
            'pagibig_loan',
            'emergency_loan',
            'contact_number',
            'address',
            'tin',
        ],
        saveUrl: employeesBulkUpdate().url,
        numericFields: ['daily_rate', 'base_salary', 'hourly_rate', 'sss_loan', 'pagibig_loan', 'emergency_loan'],
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
            <Head title="Employee Profiles" />

            <Container>
                <ContainerHeader>
                    <div>
                        <div className="flex items-center gap-2">
                            <Users className="h-6 w-6 text-primary" />
                            <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                Employee Profiles & Rates
                            </h1>
                        </div>
                        <p className="text-sm font-normal text-muted-foreground mt-0.5">
                            Manage company employee accounts, daily pay rates, and constant payroll loan deductions.
                        </p>
                    </div>
                    <ContainerHeaderEnd>
                        <div className="flex items-center gap-3">
                            <TableEditToolbar
                                isEditing={isEditing}
                                isSaving={isSaving}
                                disabled={employees.length === 0}
                                onStart={startEditing}
                                onCancel={cancelEditing}
                                onSave={saveEdits}
                            />
                            <Button asChild disabled={isEditing} className="px-5">
                                <Link href={employeeCreate().url}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    New Employee Setup
                                </Link>
                            </Button>
                        </div>
                    </ContainerHeaderEnd>
                </ContainerHeader>

                <div className="pt-2">
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
                </div>
            </Container>

            <Container>
                <div className="flex items-center gap-2 border-b border-border/60 pb-3 mb-4">
                    <Settings2 className="h-5 w-5 text-primary" />
                    <h2 className="text-base font-bold text-foreground">
                        Global Pay Rate Computation Rules
                    </h2>
                </div>
                <form onSubmit={handleSettingsSubmit}>
                    <div className="flex flex-wrap items-end gap-4">
                        <Field className="w-44">
                            <Label className="text-xs font-semibold">Days per Month</Label>
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
                        <Field className="w-44">
                            <Label className="text-xs font-semibold">Hours per Day</Label>
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
                        <Button type="submit" disabled={processing} variant="secondary">
                            {processing ? 'Updating...' : 'Update Computation Settings'}
                        </Button>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                        These parameters control automatic conversion between Daily Rates, Monthly Salaries, and Hourly Rates across all employee profiles.
                    </p>
                </form>
            </Container>
        </AppLayout>
    );
}
