import type { PlanterRow } from '@/components/planters/planters-table-types';

export const seedPlanterRows: PlanterRow[] = [
    {
        id: 'PL-0001',
        name: 'Juan Dela Cruz',
        address: 'Brgy. San Roque, Talisay City',
        status: 'Active',
        email: 'juan.delacruz@example.com',
        phone: '+63 917 000 0001',
        haciendaName: 'Hacienda Esperanza',
        haciendaLocation: 'Talisay, Negros Occidental',
        ownershipType: 'Owned',
    },
    {
        id: 'PL-0002',
        name: 'Maria Santos',
        address: 'Brgy. Mabini, Bacolod City',
        status: 'Inactive',
        email: 'maria.santos@example.com',
        phone: '+63 917 000 0002',
        haciendaName: 'Hacienda Verde',
        haciendaLocation: 'Bacolod, Negros Occidental',
        ownershipType: 'Leased',
    },
    {
        id: 'PL-0003',
        name: 'Pedro Reyes',
        address: 'Brgy. 5, Silay City',
        status: 'Active',
        email: 'pedro.reyes@example.com',
        phone: '+63 917 000 0003',
        haciendaName: 'Hacienda Santa Clara',
        haciendaLocation: 'Silay, Negros Occidental',
        ownershipType: 'Tenant',
    },
];
