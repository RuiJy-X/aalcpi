import type { AttendanceType } from '../Attendance/attendance-types';

export type PayrollType = {
    id: number;
    employee_id: number;
    employee_code?: string | null;
    employee_name: string | null;
    position?: string | null;
    daily_rate?: string | number | null;
    period_start: string;
    period_end: string;
    payroll_date?: string | null;
    days_worked: number;
    total_days: number;
    total_hours: number;
    hours_worked: number;
    hourly_rate?: string | number | null;
    basic_pay: string | number;
    overtime_pay?: string | number | null;
    overtime_hours?: string | number | null;
    holidays: number;
    gross_pay: string | number;
    cash_advance_payout?: string | number | null;
    cash_advance_deduction?: string | number | null;
    sss_loan?: string | number | null;
    pagibig_loan?: string | number | null;
    emergency_loan?: string | number | null;
    deductions: string | number;
    net_pay: string | number;
    status: string;
    created_at: string;
    updated_at: string;
};

export type PayrollEmployeeSummary = {
    id: number;
    name: string;
    employee_code?: string | null;
    position?: string | null;
    hourly_rate?: string | number | null;
    daily_rate?: string | number | null;
    base_salary?: string | number | null;
    cash_advance_balance?: string | number | null;
    attendances?: AttendanceType[];
};

export type PayrollDetailType = PayrollType & {
    employee?: PayrollEmployeeSummary | null;
};
