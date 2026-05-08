<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PreviewPayrollRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'attendance_file' => ['required', 'file', 'mimes:xlsx,xls'],
            'holidays' => ['required', 'integer', 'min:0'],
            'deductions' => ['required', 'numeric', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'attendance_file.required' => 'Please upload an attendance file.',
            'attendance_file.mimes' => 'The file must be an Excel file (xlsx or xls).',
            'holidays.required' => 'Please enter the number of holidays.',
            'holidays.min' => 'Holidays cannot be negative.',
            'deductions.required' => 'Please enter deductions.',
            'deductions.min' => 'Deductions cannot be negative.',
        ];
    }
}
