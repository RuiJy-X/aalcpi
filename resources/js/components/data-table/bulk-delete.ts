import type {
    CertificationRow,
    HaciendaRow,
    PlanterRow,
    ProductionRow,
} from '@/components/planters/planters-table-types';
import type { RawDataRow } from '@/components/raw-data/raw-data-types';
import type { UserRow } from '@/components/types/usertypes';
import type { AttendanceType } from '@/pages/Attendance/attendance-types';
import type { EmployeeType } from '@/pages/Employees/employeeTypes';
import type { PayrollType } from '@/pages/Payroll/payroll-types';
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

export const rawDataBulkDelete: BulkDeleteConfig<RawDataRow> = {
    endpoint: '/RawData/bulk-delete',
    entityName: 'raw data record',
    getRowId: (row) => row.id,
};

export const employeeBulkDelete: BulkDeleteConfig<EmployeeType> = {
    endpoint: '/Employees/bulk-delete',
    entityName: 'employee',
    getRowId: (row) => row.id,
};

export const attendanceBulkDelete: BulkDeleteConfig<AttendanceType> = {
    endpoint: '/Attendance/bulk-delete',
    entityName: 'attendance record',
    getRowId: (row) => row.id,
};

export const payrollBulkDelete: BulkDeleteConfig<PayrollType> = {
    endpoint: '/Payroll/bulk-delete',
    entityName: 'payroll record',
    getRowId: (row) => row.id,
};

export const userBulkDelete: BulkDeleteConfig<UserRow> = {
    endpoint: '/Users/bulk-delete',
    entityName: 'user',
    getRowId: (row) => row.id,
};

export const bankReconciliationBulkDelete: BulkDeleteConfig<any> = {
    endpoint: '/BankReconciliation/bulk-delete',
    entityName: 'bank reconciliation record',
    getRowId: (row) => `${row.source}:${row.source_id}`,
};
