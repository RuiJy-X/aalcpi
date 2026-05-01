import React from 'react';
import { format } from 'date-fns';
import { useForm } from '@inertiajs/react';
import type { DateRange } from 'react-day-picker';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Import } from 'lucide-react';
import type { EmployeeType } from '../Employees/employeeTypes';

const ImportAttendance = ({
    employees,
}: {
    employees: Pick<EmployeeType, 'id' | 'name'>[];
}) => {
    const { data, setData, post, processing, errors, reset } = useForm<{
        employee_id: string;
        file: File | null;
    }>({
        employee_id: '',
        file: null,
    });

    const [fileInputKey, setFileInputKey] = React.useState(0);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        setData('file', file);
    };

    const resetForm = () => {
        reset();
        setFileInputKey((currentKey) => currentKey + 1);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!data.file || !data.employee_id) {
            return;
        }

        post('/Attendance/import', {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => resetForm(),
        });
    };

    return (
        <Dialog
            onOpenChange={(open) => {
                if (!open) resetForm();
            }}
        >
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Import className="mr-2 h-4 w-4" />
                    Import Data
                </Button>
            </DialogTrigger>

            <DialogContent>
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Import Attendance</DialogTitle>
                        <DialogDescription>
                            Select the employee and date range, then import the
                            daily time record from an Excel file.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col gap-4 py-4">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="employee-id">Employee</Label>
                            <Select
                                value={data.employee_id}
                                onValueChange={(value) =>
                                    setData('employee_id', value)
                                }
                            >
                                <SelectTrigger id="employee-id">
                                    <SelectValue placeholder="Select employee" />
                                </SelectTrigger>
                                <SelectContent>
                                    {employees.map((employee) => (
                                        <SelectItem
                                            key={employee.id}
                                            value={String(employee.id)}
                                        >
                                            {employee.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.employee_id && (
                                <p className="text-xs text-red-500">
                                    {errors.employee_id}
                                </p>
                            )}
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="file-input">File</Label>
                            <Input
                                key={fileInputKey}
                                type="file"
                                id="file-input"
                                accept=".xlsx,.xls,.csv"
                                onChange={handleFileChange}
                                disabled={processing}
                            />
                            {errors.file && (
                                <p className="text-xs text-red-500">
                                    {errors.file}
                                </p>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button
                                type="button"
                                variant="outline"
                                disabled={processing}
                            >
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button
                            type="submit"
                            disabled={
                                !data.file || !data.employee_id || processing
                            }
                        >
                            {processing ? 'Importing...' : 'Import'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default ImportAttendance;
