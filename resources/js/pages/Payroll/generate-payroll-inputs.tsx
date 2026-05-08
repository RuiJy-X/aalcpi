import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { PayrollDraftData } from './generate-payroll.types';

type GeneratePayrollInputsProps = {
    data: PayrollDraftData;
    errors: Record<string, string | undefined>;
    processing: boolean;
    isPreviewing: boolean;
    fileInputKey: number;
    previewError: string | null;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onHolidaysChange: (value: string) => void;
    onDeductionsChange: (value: string) => void;
};

const GeneratePayrollInputs = ({
    data,
    errors,
    processing,
    isPreviewing,
    fileInputKey,
    previewError,
    onFileChange,
    onHolidaysChange,
    onDeductionsChange,
}: GeneratePayrollInputsProps) => {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
                <Label htmlFor="attendance-file">
                    Attendance File (XLSX) *
                </Label>
                <Input
                    key={fileInputKey}
                    id="attendance-file"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={onFileChange}
                    disabled={processing || isPreviewing}
                />
                <p className="text-xs text-gray-500">
                    Upload the attendance Excel file for the period.
                </p>
                {errors.attendance_file && (
                    <p className="text-sm text-red-500">
                        {errors.attendance_file}
                    </p>
                )}
                {previewError && (
                    <p className="text-sm text-red-500">{previewError}</p>
                )}
            </div>

            <div className="flex flex-col gap-2">
                <Label htmlFor="holidays">Holidays in Period *</Label>
                <Input
                    id="holidays"
                    type="number"
                    min="0"
                    value={data.holidays}
                    onChange={(e) => onHolidaysChange(e.target.value)}
                    disabled={processing || isPreviewing}
                />
                {errors.holidays && (
                    <p className="text-sm text-red-500">{errors.holidays}</p>
                )}
            </div>

            <div className="flex flex-col gap-2">
                <Label htmlFor="deductions">Total Deductions *</Label>
                <Input
                    id="deductions"
                    type="number"
                    step="0.01"
                    min="0"
                    value={data.deductions}
                    onChange={(e) => onDeductionsChange(e.target.value)}
                    disabled={processing || isPreviewing}
                    placeholder="0.00"
                />
                <p className="text-xs text-gray-500">
                    Include taxes, insurance, and other deductions.
                </p>
                {errors.deductions && (
                    <p className="text-sm text-red-500">{errors.deductions}</p>
                )}
            </div>
        </div>
    );
};

export default GeneratePayrollInputs;
