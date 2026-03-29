export type MillingPeriodRow = {
    id: string | number;
    week_no: number;
    crop_year: string;
    start_date: string;
    end_date: string;
    sugar_factor: number;
    mol_factor: number;
    sugar_price: number;
    mol_price: number;
    created_at?: string;
    updated_at?: string;
};
