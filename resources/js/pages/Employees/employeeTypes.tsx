export type EmployeeType = {
    id: number;
    name: string;
    hourly_rate: string | number;
    position: string;
    employment_type: string;
    base_salary: string | number;
    department?: string;
    address?: string;
    tin?: string;
    contact_number?: string;
    created_at: string;
    updated_at: string;
};
