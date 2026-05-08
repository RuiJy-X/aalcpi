export type AttendanceRow = {
    date: string;
    time_in: string | null;
    time_out: string | null;
    working_time: number;
};

export type PayrollPreviewEmployee = {
    id: number | null;
    employee_code: string;
    name: string;
    department: string | null;
    position: string | null;
    employment_type: string | null;
    hourly_rate: number | null;
    base_salary: number | null;
    exists: boolean;
};

export type PayrollPreviewResponse = {
    employee: PayrollPreviewEmployee;
    period_start: string | null;
    period_end: string | null;
    attendance: {
        rows: AttendanceRow[];
        total_hours: number;
        total_days: number;
    };
    payroll: {
        basic_pay: number;
        holiday_pay: number;
        gross_pay: number;
        deductions: number;
        net_pay: number;
    };
};

export type PayrollDraftData = {
    attendance_file: File | null;
    holidays: string;
    deductions: string;
    employee_code: string;
    employee_name: string;
    department: string;
    position: string;
    employment_type: string;
    hourly_rate: string;
    base_salary: string;
};
