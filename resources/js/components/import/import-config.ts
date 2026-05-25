import productions from '@/routes/productions';
import planters from '@/routes/planters';

export interface ImportConfig {
    route: string;
    label: string;
    requireCropYear?: boolean;
    headerGuide?: string[];
    mappingType?: 'planters' | 'productions';
    mappingTargets?: ImportTarget[];
    extraFields?: ImportExtraField[];
}

export interface ImportExtraField {
    key: string;
    label: string;
    placeholder?: string;
    type?: 'text' | 'number';
    step?: string;
}

export interface ImportTarget {
    key: string;
    label: string;
    required?: boolean;
    group?: string;
}

export const plantersImportConfig = {
    route: planters.import.url(),
    label: 'Planter Data',
    mappingType: 'planters' as const,
    mappingTargets: [
        {
            key: 'planter_code',
            label: 'Planter Code',
            required: true,
            group: 'Planters',
        },
        {
            key: 'name',
            label: 'Planter Name',
            required: true,
            group: 'Planters',
        },
        { key: 'address', label: 'Planter Address', group: 'Planters' },
        { key: 'contact_number', label: 'Contact Number', group: 'Planters' },
        { key: 'tin_number', label: 'TIN Number', group: 'Planters' },
        {
            key: 'registration_date',
            label: 'Registration Date',
            group: 'Planters',
        },
        {
            key: 'hacienda_code',
            label: 'Hacienda Code',
            group: 'Haciendas',
        },
        {
            key: 'hacienda_name',
            label: 'Hacienda Name',
            group: 'Haciendas',
        },
        {
            key: 'hacienda_address',
            label: 'Hacienda Address',
            group: 'Haciendas',
        },
        { key: 'area_hectares', label: 'Area (Hectares)', group: 'Haciendas' },
        {
            key: 'distance_from_urc',
            label: 'Distance From URC',
            group: 'Haciendas',
        },
    ],
};

export const productionsImportConfig = {
    route: productions.import.url(),
    label: 'Productions Data',
    requireCropYear: true,
    mappingType: 'productions' as const,
    extraFields: [
        {
            key: 'composite_sugar_price',
            label: 'Composite Sugar Price',
            placeholder: '0.00',
            type: 'number',
            step: '0.01',
        },
        {
            key: 'composite_molasses_price',
            label: 'Composite Molasses Sugar Price',
            placeholder: '0.00',
            type: 'number',
            step: '0.01',
        },
    ],
    mappingTargets: [
        {
            key: 'planter_code',
            label: 'Planter Code',
            required: true,
            group: 'Planters',
        },
        {
            key: 'planter_name',
            label: 'Planter Name',
            required: true,
            group: 'Planters',
        },
        {
            key: 'hacienda_code',
            label: 'Hacienda Code',
            group: 'Haciendas',
        },
        { key: 'hacienda_name', label: 'Hacienda Name', group: 'Haciendas' },
        {
            key: 'trans_code',
            label: 'Trans Code',
            group: 'Productions',
        },
        {
            key: 'gross_cw',
            label: 'Gross CW',
            group: 'Productions',
        },
        {
            key: 'net_cw',
            label: 'Net CW',
            required: true,
            group: 'Productions',
        },
        {
            key: 'trucks',
            label: 'Trucks',
            group: 'Productions',
        },
        {
            key: 'theoretical_lkg',
            label: 'Theoretical LKG',
            group: 'Productions',
        },
        {
            key: 'actual_lkg',
            label: 'Actual LKG',
            required: true,
            group: 'Productions',
        },
        {
            key: 'pshr_net_lkg',
            label: 'Planter Share Net LKG',
            required: true,
            group: 'Productions',
        },
        {
            key: 'pdpa_lkg',
            label: 'PDPA LKG',
            group: 'Productions',
        },
        {
            key: 'association_dues_lkg',
            label: 'Association Dues LKG',
            group: 'Productions',
        },
        {
            key: 'actual_mol',
            label: 'Actual MOL',
            required: true,
            group: 'Productions',
        },
        {
            key: 'pshr_net_mol',
            label: 'Planter Share Net MOL',
            required: true,
            group: 'Productions',
        },
        {
            key: 'pdpa_mol',
            label: 'PDPA MOL',
            group: 'Productions',
        },
        {
            key: 'association_dues_mol',
            label: 'Association Dues MOL',
            group: 'Productions',
        },
        { key: 'transloading', label: 'Transloading', group: 'Productions' },
    ],
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
