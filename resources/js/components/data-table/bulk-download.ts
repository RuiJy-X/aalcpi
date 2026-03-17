import { bulk_download } from './../../routes/productions/index';
import type {
    CertificationRow,
    HaciendaRow,
    PlanterRow,
    ProductionRow,
} from '@/components/planters/planters-table-types';

export interface BulkDownloadConfig<TData> {
    endpoint: string;
    entityName: string;
    getRowId: (row: TData) => string | number;
}

export const productionBulkDownload: BulkDownloadConfig<ProductionRow> = {
    endpoint: '/Productions/bulk-download',
    entityName: 'production record',
    getRowId: (row) => row.id,
};
