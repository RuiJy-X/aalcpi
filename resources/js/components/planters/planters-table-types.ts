export type PlanterStatus = 'Active' | 'Inactive';

export type OwnershipType = 'Owned' | 'Leased' | 'Tenant';

export type PlanterRow = {
    id: string;
    name: string;
    address: string;
    status: PlanterStatus;
    email: string;
    phone: string;
    haciendaName: string;
    haciendaLocation: string;
    ownershipType: OwnershipType;
};

export type SortKey = keyof Pick<
    PlanterRow,
    | 'id'
    | 'name'
    | 'address'
    | 'status'
    | 'email'
    | 'phone'
    | 'haciendaName'
    | 'haciendaLocation'
    | 'ownershipType'
>;

export type SortState = {
    key: SortKey;
    direction: 'asc' | 'desc';
};

export type PlantersTabKey = 'planters' | 'records' | 'certifications';
