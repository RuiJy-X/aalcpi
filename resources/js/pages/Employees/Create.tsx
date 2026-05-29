import { useForm } from '@inertiajs/react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { FormEventHandler } from 'react';
import { store as employeeStore } from '@/actions/App/Http/Controllers/EmployeeController';

import type { EmployeeType } from './employeeTypes';

type EmployeeFormData = Omit<EmployeeType, 'id' | 'created_at' | 'updated_at'>;

const DEPARTMENTS = [
    'Administration',
    'Finance',
    'Operations',
    'HR',
    'IT',
] as const;

const EMPLOYMENT_TYPES = [
    'Regular',
    'Part-time',
    'Contractual',
    'Probationary',
] as const;

interface AddEmployeeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const computeHourlyRate = (monthlySalary: number): string => {
    // Philippine standard: 313 working days/year ÷ 12 months × 8 hours
    const hourlyRate = monthlySalary / 24 / 8;
    return hourlyRate.toFixed(2);
};

export default function AddEmployeeDialog({
    open,
    onOpenChange,
}: AddEmployeeDialogProps) {
    const { data, setData, post, processing, errors, reset } =
        useForm<EmployeeFormData>({
            name: '',
            employee_code: '',
            hourly_rate: '',
            position: '',
            employment_type: '',
            base_salary: '',
            department: '',
            address: '',
            tin: '',
            contact_number: '',
        });

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        post(employeeStore.url(), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onOpenChange(false);
            },
        });
    };

    const handleOpenChange = (value: boolean) => {
        if (!value) reset();
        onOpenChange(value);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-h-[90vh] max-w-[95vw] overflow-y-auto md:max-w-6xl">
                <DialogHeader>
                    <DialogTitle className="text-base font-medium">
                        Add Employee
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-1">
                    {/* Employee Code */}
                    <div className="space-y-1.5">
                        <Label htmlFor="employee_code">Employee Code</Label>
                        <Input
                            id="employee_code"
                            placeholder="e.g. 1"
                            type="number"
                            value={data.employee_code}
                            onChange={(e) =>
                                setData('employee_code', e.target.value)
                            }
                            disabled={processing}
                        />
                        {errors.employee_code && (
                            <p className="text-xs text-red-500">
                                {errors.employee_code}
                            </p>
                        )}
                    </div>

                    {/* Name */}
                    <div className="space-y-1.5">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                            id="name"
                            placeholder="Juan Dela Cruz"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            disabled={processing}
                        />
                        {errors.name && (
                            <p className="text-xs text-red-500">
                                {errors.name}
                            </p>
                        )}
                    </div>

                    {/* Position */}
                    <div className="space-y-1.5">
                        <Label htmlFor="position">Position</Label>
                        <Input
                            id="position"
                            placeholder="e.g. Accountant"
                            value={data.position}
                            onChange={(e) =>
                                setData('position', e.target.value)
                            }
                            disabled={processing}
                        />
                        {errors.position && (
                            <p className="text-xs text-red-500">
                                {errors.position}
                            </p>
                        )}
                    </div>

                    {/* Department + Employment Type */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label>Department</Label>
                            <Select
                                value={data.department}
                                onValueChange={(v) => setData('department', v)}
                                disabled={processing}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select dept." />
                                </SelectTrigger>
                                <SelectContent>
                                    {DEPARTMENTS.map((d) => (
                                        <SelectItem key={d} value={d}>
                                            {d}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.department && (
                                <p className="text-xs text-red-500">
                                    {errors.department}
                                </p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <Label>Employment Type</Label>
                            <Select
                                value={data.employment_type}
                                onValueChange={(v) =>
                                    setData('employment_type', v)
                                }
                                disabled={processing}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {EMPLOYMENT_TYPES.map((t) => (
                                        <SelectItem key={t} value={t}>
                                            {t}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.employment_type && (
                                <p className="text-xs text-red-500">
                                    {errors.employment_type}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Hourly Rate + Base Salary */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="base_salary">Base Salary (₱)</Label>
                            <Input
                                id="base_salary"
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                value={data.base_salary}
                                onChange={(e) => {
                                    const monthly =
                                        parseFloat(e.target.value) || 0;
                                    setData({
                                        ...data,
                                        base_salary: e.target.value,
                                        hourly_rate: computeHourlyRate(monthly),
                                    });
                                }}
                                disabled={processing}
                            />
                            {errors.base_salary && (
                                <p className="text-xs text-red-500">
                                    {errors.base_salary}
                                </p>
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <Label
                                htmlFor="hourly_rate"
                                className="flex flex-col"
                            >
                                Hourly Rate (₱)
                            </Label>
                            <Input
                                id="hourly_rate"
                                type="number"
                                placeholder="0.00"
                                value={data.hourly_rate}
                                readOnly
                                className="cursor-not-allowed bg-muted text-muted-foreground"
                                tabIndex={-1}
                            />
                            <span className="align-center m-auto ml-1.5 w-full self-center text-center text-xs font-normal text-muted-foreground">
                                auto-computed ({data.base_salary ?? 'Php'} / 24
                                days a month / 8 hrs a wk)
                            </span>
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        {/* Address */}
                        <Label htmlFor="address">Address</Label>
                        <Input
                            id="address"
                            placeholder="123 Main St, City, Province"
                            value={data.address}
                            onChange={(e) => setData('address', e.target.value)}
                            disabled={processing}
                        />
                        {errors.address && (
                            <p className="text-xs text-red-500">
                                {errors.address}
                            </p>
                        )}
                    </div>
                    <div className="space-y-1.5">
                        {/* TIN */}
                        <Label htmlFor="tin">TIN</Label>
                        <Input
                            id="tin"
                            value={data.tin}
                            onChange={(e) => setData('tin', e.target.value)}
                            disabled={processing}
                        />
                        {errors.tin && (
                            <p className="text-xs text-red-500">{errors.tin}</p>
                        )}
                    </div>
                    <div className="space-y-1.5">
                        {/* Contact Number */}
                        <Label htmlFor="contact_number">Contact Number</Label>
                        <Input
                            id="contact_number"
                            placeholder="e.g. 09171234567"
                            value={data.contact_number}
                            onChange={(e) =>
                                setData('contact_number', e.target.value)
                            }
                            disabled={processing}
                        />
                        {errors.contact_number && (
                            <p className="text-xs text-red-500">
                                {errors.contact_number}
                            </p>
                        )}
                    </div>

                    <DialogFooter className="pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleOpenChange(false)}
                            disabled={processing}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Saving...' : 'Save Employee'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
