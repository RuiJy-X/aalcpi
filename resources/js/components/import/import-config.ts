import productions from '@/routes/productions';
import planters from '@/routes/planters';

export interface ImportConfig {
    route: string;
    label: string;
    requireCropYear?: boolean;
}

export const plantersImportConfig = {
    route: planters.import.url(),
    label: 'Planter Data',
};

export const productionsImportConfig = {
    route: productions.import.url(),
    label: 'Productions Data',
    requireCropYear: true,
};

export const rawDataImportConfig = {
    route: '/RawData/import',
    label: 'Raw Data',
};
