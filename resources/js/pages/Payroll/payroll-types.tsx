export type PayrollType = {
    id: number;
    employee_id: number;
    employee_name: string;
    period_start: string;
    period_end: string;
    basic_pay: string | number;
    overtime_pay: string | number;
    deductions: string | number;
    gross_pay: string | number;
    net_pay: string | number;
    status: string;
    created_at: string;
    updated_at: string;
};
