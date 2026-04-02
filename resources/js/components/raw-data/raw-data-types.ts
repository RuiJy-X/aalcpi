export type RawDataRow = {
    id: number | string;
    planter_code: string;
    crop_year: string;
    date: string;
    gross_cw: number;
    net_cw: number;
    trucks: number
    theoretical_lkg: number;
    actual_lkg: number;

}

export const rawDataRowKeys: (keyof RawDataRow)[] = [
    'id',
    'planter_code',
    'crop_year',
    'date',
    'gross_cw',
    'net_cw',
    'trucks',
    'theoretical_lkg',
    'actual_lkg'
];