import productions from '@/routes/productions';
import planters from '@/routes/planters';

export interface ImportConfig {
    route: string;
    label: string;
    requireCropYear?: boolean;
    headerGuide?: string[];
}

export const plantersImportConfig = {
    route: planters.import.url(),
    label: 'Planter Data',
};

export const productionsImportConfig = {
    route: productions.import.url(),
    label: 'Productions Data',
    requireCropYear: true,
    headerGuide: [
        'planter_code',
        'planter_name',
        'hacienda_code',
        'hacienda_name',
        'hacienda_address',
        'gross_cw',
        'net_cw',
        'trucks',
        'theoretical_lkg',
        'actual_lkg',
        'pshr_net_lkg',
        'pdpa_lkg',
        'association_dues_lkg',
        'actual_mol',
        'pshr_net_mol',
        'pdpa_mol',
        'association_dues_mol',
        'trans_code',
        'transloading',
    ],
};

export const rawDataImportConfig = {
    route: '/RawData/import',
    label: 'Raw Data',
};
