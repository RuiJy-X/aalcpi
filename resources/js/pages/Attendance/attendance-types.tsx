export type AttendanceType = {
    id: number;
    employee_id: number;
    employee_name: string;
    date: string;
    week: string | number;
    time_in: string;
    time_out: string;
    times: string | number;
    working_time: number;
};
