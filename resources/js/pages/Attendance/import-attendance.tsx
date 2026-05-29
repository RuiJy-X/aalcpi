import React from 'react';
import { format } from 'date-fns';
import { useForm, usePage } from '@inertiajs/react';
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
import { SharedData } from '@/types';

const ImportAttendance = ({
    employees,
}: {
    employees: Pick<EmployeeType, 'id' | 'name'>[];
}) => {
    const page = usePage<SharedData>();
    const flashSuccess = page.props.flash?.success;
    const [successMessage, setSuccessMessage] = React.useState<string | null>(
        flashSuccess ?? null,
    );

    const { data, setData, post, processing, errors, reset } = useForm<{
        file: File | null;
    }>({
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

        if (!data.file) {
            return;
        }

        post('/Attendance/import', {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => resetForm(),
        });
    };

    React.useEffect(() => {
        if (!flashSuccess) {
            return;
        }

        setSuccessMessage(flashSuccess);

        const timeout = window.setTimeout(() => {
            setSuccessMessage(null);
        }, 5000);

        return () => window.clearTimeout(timeout);
    }, [flashSuccess]);

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
                {successMessage && (
                    <div className="mb-4 rounded-md bg-green-50 p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg
                                    className="h-5 w-5 text-green-400"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    aria-hidden="true"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.707a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-green-800">
                                    {successMessage}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Import Attendance</DialogTitle>
                        <DialogDescription>
                            Select the employee and date range, then import the
                            daily time record from an Excel file.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col gap-4 py-4">
                        {/* <div className="flex flex-col gap-2">
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
                        </div> */}

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
                            disabled={!data.file || processing}
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
