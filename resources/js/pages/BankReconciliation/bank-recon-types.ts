export type BankStatementType = {
    id: number;
    tdate: string;
    checkno: string;
    branch_description: string;
    partic: string;
    debit: number;
    credit: number | null;
    currency: string;
    running_balance: number;
    created_at: string;
    updated_at: string;
}

export type ReconciliationStatus = 'Matched' | 'Amount Mismatch' | 'Outstanding' | 'Unrecorded Bank Entry';
export type ReconciliationSource = 'internal' | 'bank';

export type ReconciliationWorkspaceType = {
    source_id: number;
    source: ReconciliationSource;
    transaction_date: string; // Y-m-d format
    ref_no: string;
    description: string;
    internal_amount: number | null;
    bank_amount: number | null;
    internal_source: string | null; // e.g. "Internal Disbursement #123"
    bank_source: string | null; // e.g. "Bank Statement #456"
    status: ReconciliationStatus;
};
    