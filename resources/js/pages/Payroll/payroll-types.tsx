import type { AttendanceType } from '../Attendance/attendance-types';

export type PayrollType = {
    id: number;
    employee_id: number;
    employee_name: string | null;
    period_start: string;
    period_end: string;
    payroll_date?: string | null;
    days_worked: number;
    total_days: number;
    total_hours: number;
    hours_worked: number;
    hourly_rate?: string | number | null;
    basic_pay: string | number;
    holidays: number;
    gross_pay: string | number;
    deductions: string | number;
    net_pay: string | number;
    status: string;
    created_at: string;
    updated_at: string;
};

export type PayrollEmployeeSummary = {
    id: number;
    name: string;
    department?: string | null;
    position?: string | null;
    employment_type?: string | null;
    hourly_rate?: string | number | null;
    base_salary?: string | number | null;
    attendances?: AttendanceType[];
};

export type PayrollDetailType = PayrollType & {
    employee?: PayrollEmployeeSummary | null;
};
