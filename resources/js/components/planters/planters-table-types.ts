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

export type PlanterWithRelations = PlanterRow & {
    haciendas: HaciendaRow[];
    productions: ProductionRow[];
    certifications: CertificationRow[];
};

export type HaciendaRow = {
    id: string;
    planter_name: string; // Temporary field to hold planter name for display purposes
    hacienda_code: string;
    planter_id: string;
    name: string;
    address: string;
    area_hectares: number;
    distance_from_urc: number;
    is_active: boolean;
    registered_date: string;
    created_at?: string;
    updated_at?: string;
};
export type ProductionRow = {
    id: string;
    planter_id: string;
    hacienda_id: string;
    hacienda_code: string;
    planter_code: string;
    planter_name: string;
    hacienda_name: string;
    hacienda_address: string;
    crop_year?: string | null;
    week_no?: number | null;
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
    composite_sugar_price?: number | string | null;
    composite_molasses_price?: number | string | null;
    trans_code?: string | null;
    transloading?: boolean | null;
    milling_period_id?: string | number | null;
    financial_status?:
        | 'pending_price'
        | 'calculated_pending_review'
        | 'accepted'
        | null;
    distribution_total?: number | string | null;
    molasses_total?: number | string | null;
    planter_lkg_money?: number | string | null;
    pdpa_lkg_money?: number | string | null;
    association_dues_lkg_money?: number | string | null;
    planter_mol_money?: number | string | null;
    pdpa_mol_money?: number | string | null;
    association_dues_mol_money?: number | string | null;
    financial_calculated_at?: string | null;
    financial_reviewed_at?: string | null;
    financial_reviewed_by?: string | number | null;
    financial_rejection_reason?: string | null;
    created_at?: string;
    updated_at?: string;
};

export type CertificationRow = {
    id: string;
    planter_id: string;
    hacienda_id: string;
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
