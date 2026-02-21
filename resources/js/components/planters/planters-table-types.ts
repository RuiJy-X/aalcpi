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
};
export type ProductionRow = {
    planter_id: string;
    land_id: string;
    production_year: number;
    production_month: number;
    gross_cw: number;
    net_cw: number;
    trucks: number;
    theoretical_lkg: number;
    actual_lkg: number;
    pshr_net_lkg: number;
    pdpa_lkg: number;
    association_dues_lkg: number;
    actual_mol: number;
    pshr_net_mol: number;
    pdpa_mol: number;
    association_dues_mol: number;
    trans_code?: string | null;
    transloading?: boolean | null;
};

export type CertificationRow = {
    planter_id: string;
    land_id: string;
    production_id: string;
    certification_type: string;
    issue_date: string;
    status: string;
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
    | 'registration_date'
    | 'created_at'
    | 'updated_at'
>;

export type SortState = {
    key: SortKey;
    direction: 'asc' | 'desc';
};

export type PlantersTabKey = 'planters' | 'records' | 'certifications';
