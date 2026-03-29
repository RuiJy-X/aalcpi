import type {
    CertificationRow,
    HaciendaRow,
    PlanterRow,
    ProductionRow,
} from '@/components/planters/planters-table-types';
import { MillingPeriodRow } from '../milling-periods/milling-periods-types';

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

export const haciendaBulkDelete: BulkDeleteConfig<HaciendaRow> = {
    endpoint: '/HACIENDAS/bulk-delete',
    entityName: 'HACIENDA',
    getRowId: (row) => row.id,
};

export const certificationBulkDelete: BulkDeleteConfig<CertificationRow> = {
    endpoint: '/Certifications/bulk-delete',
    entityName: 'certification',
    getRowId: (row) => row.id,
};

export const millingPeriodBulkDelete: BulkDeleteConfig<MillingPeriodRow> = {
    endpoint: '/MillingPeriods/bulk-delete',
    entityName: 'milling period',
    getRowId: (row) => row.id,
};
