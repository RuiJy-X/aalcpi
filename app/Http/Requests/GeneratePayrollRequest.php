<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class GeneratePayrollRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array|string>
     */
    public function rules(): array
    {
        return [
            'attendance_file' => ['required', 'file', 'mimes:xlsx,xls'],
            'holidays' => ['required', 'integer', 'min:0'],
            'deductions' => ['required', 'numeric', 'min:0'],
            'employee_code' => ['required', 'string'],
            'employee_name' => ['required', 'string'],
            'department' => ['nullable', 'string'],
            'position' => ['nullable', 'string'],
            'employment_type' => ['nullable', 'string'],
            'hourly_rate' => ['required', 'numeric', 'min:0'],
            'base_salary' => ['nullable', 'numeric', 'min:0'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'attendance_file.required' => 'Please upload an attendance file.',
            'attendance_file.mimes' => 'The file must be an Excel file (xlsx or xls).',
            'holidays.required' => 'Please enter the number of holidays.',
            'holidays.min' => 'Holidays cannot be negative.',
            'deductions.required' => 'Please enter deductions.',
            'deductions.min' => 'Deductions cannot be negative.',
            'employee_code.required' => 'Employee code is required.',
            'employee_name.required' => 'Employee name is required.',
            'hourly_rate.required' => 'Hourly rate is required.',
            'hourly_rate.min' => 'Hourly rate cannot be negative.',
            'base_salary.min' => 'Base salary cannot be negative.',
        ];
    }
}
