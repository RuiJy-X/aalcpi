import type {
    CertificationRow,
    LandRow,
    PlanterRow,
    ProductionRow,
} from '@/components/planters/planters-table-types';

export interface BulkDeleteConfig<TData> {
    endpoint: string;
    entityName: string;
    getRowId: (row: TData) => string | number;
}

export const planterBulkDelete: BulkDeleteConfig<PlanterRow> = {
    endpoint: '/Planters/bulk-delete',
    entityName: 'planter',
    getRowId: (row) => row.id,
};

export const productionBulkDelete: BulkDeleteConfig<ProductionRow> = {
    endpoint: '/Productions/bulk-delete',
    entityName: 'production record',
    getRowId: (row) => row.id,
};

export const landBulkDelete: BulkDeleteConfig<LandRow> = {
    endpoint: '/Lands/bulk-delete',
    entityName: 'land',
    getRowId: (row) => row.id,
};

export const certificationBulkDelete: BulkDeleteConfig<CertificationRow> = {
    endpoint: '/Certifications/bulk-delete',
    entityName: 'certification',
    getRowId: (row) => row.id,
};
