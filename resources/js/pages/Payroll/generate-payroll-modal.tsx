import React, { useMemo, useState } from 'react';
import { useForm } from '@inertiajs/react';
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
import { Button } from '@/components/ui/button';
import { FileUp } from 'lucide-react';
import { calculatePayrollSummary, parseNumber } from './generate-payroll.utils';
import { postPayrollPreview } from './generate-payroll.api';
import type {
    PayrollDraftData,
    PayrollPreviewResponse,
} from './generate-payroll.types';
import GeneratePayrollInputs from './generate-payroll-inputs';
import GeneratePayrollEmployeeDetails from './generate-payroll-employee-details';
import GeneratePayrollSummary from './generate-payroll-summary';
import GeneratePayrollStepper from './generate-payroll-stepper';

const GeneratePayrollModal = () => {
    const { data, setData, post, processing, errors, reset, clearErrors } =
        useForm<PayrollDraftData>({
            attendance_file: null,
            holidays: '0',
            deductions: '0',
            employee_code: '',
            employee_name: '',
            department: '',
            position: '',
            employment_type: '',
            hourly_rate: '',
            base_salary: '',
        });

    const [fileInputKey, setFileInputKey] = useState(0);
    const [preview, setPreview] = useState<PayrollPreviewResponse | null>(null);
    const [isPreviewing, setIsPreviewing] = useState(false);
    const [previewError, setPreviewError] = useState<string | null>(null);
    const [step, setStep] = useState(1);

    const steps = [
        { label: 'Upload File' },
        { label: 'Employee Details' },
        { label: 'Review Payroll' },
    ];

    const payrollSummary = useMemo(() => {
        if (!preview) return null;

        return calculatePayrollSummary({
            totalHours: preview.attendance.total_hours,
            hourlyRate: parseNumber(data.hourly_rate),
            holidays: Math.max(0, parseInt(data.holidays || '0', 10)),
            deductions: Math.max(0, parseNumber(data.deductions)),
        });
    }, [preview, data.hourly_rate, data.holidays, data.deductions]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        setData('attendance_file', file);
        setPreview(null);
        setPreviewError(null);
        setStep(1);
    };

    const resetForm = () => {
        reset();
        clearErrors();
        setPreview(null);
        setPreviewError(null);
        setFileInputKey((prev) => prev + 1);
        setStep(1);
    };

    const handlePreview = async () => {
        if (!data.attendance_file) return;

        setIsPreviewing(true);
        setPreviewError(null);

        try {
            const formData = new FormData();
            formData.append('attendance_file', data.attendance_file);
            formData.append('holidays', data.holidays || '0');
            formData.append('deductions', data.deductions || '0');

            const response = await postPayrollPreview(formData);

            setPreview(response);
            setData('employee_code', response.employee.employee_code);
            setData('employee_name', response.employee.name ?? '');
            setData('department', response.employee.department ?? '');
            setData('position', response.employee.position ?? '');
            setData('employment_type', response.employee.employment_type ?? '');
            setData(
                'hourly_rate',
                response.employee.hourly_rate !== null
                    ? String(response.employee.hourly_rate)
                    : '',
            );
            setData(
                'base_salary',
                response.employee.base_salary !== null
                    ? String(response.employee.base_salary)
                    : '',
            );
            setStep(2);
        } catch (error) {
            setPreviewError((error as Error).message);
        } finally {
            setIsPreviewing(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!preview || !data.attendance_file) {
            return;
        }

        post('/Payroll/generate', {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => resetForm(),
        });
    };

    const isEmployeeReady =
        data.employee_name.trim() !== '' && data.hourly_rate.trim() !== '';

    return (
        <Dialog
            onOpenChange={(open) => {
                if (!open) resetForm();
            }}
        >
            <DialogTrigger asChild>
                <Button variant="default">
                    <FileUp className="mr-2 h-4 w-4" />
                    Generate Payroll
                </Button>
            </DialogTrigger>

            <DialogContent className="max-h-[90vh] max-w-[95vw] overflow-y-auto md:max-w-6xl">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Generate Payroll</DialogTitle>
                        <DialogDescription>
                            Upload the attendance file to preview payroll
                            details before saving.
                        </DialogDescription>
                    </DialogHeader>

                    <GeneratePayrollStepper steps={steps} currentStep={step} />

                    <div className="flex flex-col gap-4 py-4">
                        {step === 1 && (
                            <GeneratePayrollInputs
                                data={data}
                                errors={errors}
                                processing={processing}
                                isPreviewing={isPreviewing}
                                fileInputKey={fileInputKey}
                                previewError={previewError}
                                onFileChange={handleFileChange}
                                onHolidaysChange={(value) =>
                                    setData('holidays', value)
                                }
                                onDeductionsChange={(value) =>
                                    setData('deductions', value)
                                }
                            />
                        )}

                        {step === 2 && preview && (
                            <GeneratePayrollEmployeeDetails
                                setData={setData}
                                data={data}
                                errors={errors}
                                processing={processing}
                                employeeExists={preview.employee.exists}
                                onChange={(field, value) =>
                                    setData(field, value)
                                }
                            />
                        )}

                        {step === 3 && preview && (
                            <GeneratePayrollSummary
                                preview={preview}
                                summary={payrollSummary}
                                data={data}
                            />
                        )}
                    </div>

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                        </DialogClose>
                        {step === 1 && (
                            <Button
                                type="button"
                                onClick={handlePreview}
                                disabled={
                                    !data.attendance_file ||
                                    processing ||
                                    isPreviewing
                                }
                            >
                                {isPreviewing
                                    ? 'Previewing...'
                                    : 'Preview Payroll'}
                            </Button>
                        )}

                        {step === 2 && (
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setStep(1)}
                                >
                                    Back
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() => setStep(3)}
                                    disabled={!isEmployeeReady}
                                >
                                    Review Payroll
                                </Button>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setStep(2)}
                                >
                                    Back
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing
                                        ? 'Generating...'
                                        : 'Generate Payroll'}
                                </Button>
                            </div>
                        )}
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default GeneratePayrollModal;
