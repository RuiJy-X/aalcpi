import { PlanterRow } from '../planters/planters-table-types';

export type RawDataRow = {
    id: number | string;
    planter_code: string;
    crop_year: string;
    date: string;
    gross_cw: number;
    net_cw: number;
    trucks: number;
    theoretical_lkg: number;
    actual_lkg: number;
    calculated_sugar: number;
    trash: number;
    Lkg_per_TC: number;
    planter?: Pick<PlanterRow, 'id' | 'planter_code' | 'name'> | null;
};

export type RawDataFormData = {
    crop_year: string;
    date: string;
    planter_code: string;
    gross_cw: string;
    net_cw: string;
    trucks: string;
    theoretical_lkg: string;
    actual_lkg: string;
    calculated_sugar: string;
    trash: string;
    Lkg_per_TC: string;
};

export const rawDataRowKeys: (keyof RawDataRow)[] = [
    'id',
    'planter_code',
    'crop_year',
    'date',
    'gross_cw',
    'net_cw',
    'trucks',
    'theoretical_lkg',
    'actual_lkg',
    'Lkg_per_TC',
    'trash',
    'calculated_sugar',
];
