import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { PayrollDraftData } from './generate-payroll.types';
import { computeHourlyRate } from './generate-payroll.utils';

type GeneratePayrollEmployeeDetailsProps = {
    data: PayrollDraftData;
    setData: any;
    errors: Record<string, string | undefined>;
    processing: boolean;
    employeeExists: boolean;
    onChange: (field: keyof PayrollDraftData, value: string) => void;
};

const GeneratePayrollEmployeeDetails = ({
    data,
    setData,
    errors,
    processing,
    employeeExists,
    onChange,
}: GeneratePayrollEmployeeDetailsProps) => {
    return (
        <div className="flex flex-col gap-4">
            <div className="text-sm font-semibold text-slate-700">
                Employee Details
            </div>

            {!employeeExists && (
                <p className="text-xs text-amber-700">
                    Employee not found. Please confirm the details before
                    saving.
                </p>
            )}

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                    <Label htmlFor="employee-code">Employee Code</Label>
                    <Input
                        id="employee-code"
                        value={data.employee_code}
                        disabled
                    />
                    {errors.employee_code && (
                        <p className="text-sm text-red-500">
                            {errors.employee_code}
                        </p>
                    )}
                </div>

                <div className="flex flex-col gap-2">
                    <Label htmlFor="employee-name">Employee Name *</Label>
                    <Input
                        id="employee-name"
                        value={data.employee_name}
                        onChange={(e) =>
                            onChange('employee_name', e.target.value)
                        }
                        disabled={processing}
                    />
                    {errors.employee_name && (
                        <p className="text-sm text-red-500">
                            {errors.employee_name}
                        </p>
                    )}
                </div>

                <div className="flex flex-col gap-2">
                    <Label htmlFor="department">Department</Label>
                    <Input
                        id="department"
                        value={data.department}
                        onChange={(e) => onChange('department', e.target.value)}
                        disabled={processing}
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <Label htmlFor="position">Position</Label>
                    <Input
                        id="position"
                        value={data.position}
                        onChange={(e) => onChange('position', e.target.value)}
                        disabled={processing}
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <Label htmlFor="employment-type">Employment Type</Label>
                    <Input
                        id="employment-type"
                        value={data.employment_type}
                        onChange={(e) =>
                            onChange('employment_type', e.target.value)
                        }
                        disabled={processing}
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <Label htmlFor="hourly-rate">Hourly Rate *</Label>
                    <Input
                        id="hourly-rate"
                        type="number"
                        step="0.01"
                        min="0"
                        value={data.hourly_rate}
                        onChange={(e) =>
                            onChange('hourly_rate', e.target.value)
                        }
                        disabled={processing}
                    />
                    {errors.hourly_rate && (
                        <p className="text-sm text-red-500">
                            {errors.hourly_rate}
                        </p>
                    )}
                </div>

                <div className="flex flex-col gap-2">
                    <Label htmlFor="base-salary">Base Salary</Label>
                    <Input
                        id="base-salary"
                        type="number"
                        step="0.01"
                        min="0"
                        value={data.base_salary}
                        onChange={(e) => {
                            const monthly = parseFloat(e.target.value) || 0;
                            setData({
                                ...data,
                                base_salary: e.target.value,
                                hourly_rate: computeHourlyRate(monthly),
                            });
                            onChange('base_salary', e.target.value);
                        }}
                        disabled={processing}
                    />
                    {errors.base_salary && (
                        <p className="text-sm text-red-500">
                            {errors.base_salary}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GeneratePayrollEmployeeDetails;
