export type PayrollType = {
    id: number;
    employee_id: number;
    employee_name: string;
    period_start: string;
    period_end: string;
    days_worked: number;
    total_days: number;
    total_hours: number;
    hours_worked: number;
    basic_pay: string | number;
    holidays: number;
    gross_pay: string | number;
    deductions: string | number;
    net_pay: string | number;
    status: string;
    created_at: string;
    updated_at: string;
};
