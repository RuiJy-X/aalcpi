export type PlanterStatus = 'Active' | 'Inactive';

export type OwnershipType = 'Owned' | 'Leased' | 'Tenant';

export type PlanterRow = {
    id: string;
    planter_code: string;
    name: string;
    address: string;
    status: PlanterStatus;
    tin_number: string;
    contact_number: string;
    registration_date: string;
    created_at?: string;
    updated_at?: string;
    haciendaName: string;
    haciendaLocation: string;
    ownershipType: OwnershipType;
};

export type SortKey = keyof Pick<
    PlanterRow,
    | 'id'
    | 'planter_code'
    | 'name'
    | 'address'
    | 'status'
    | 'tin_number'
    | 'contact_number'
    | 'haciendaName'
    | 'haciendaLocation'
    | 'ownershipType'
    | 'registration_date'
    | 'created_at'
    | 'updated_at'
>;

export type SortState = {
    key: SortKey;
    direction: 'asc' | 'desc';
};

export type PlantersTabKey = 'planters' | 'records' | 'certifications';
