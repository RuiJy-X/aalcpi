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
};

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
    internal_date_issued: string | null; // Y-m-d format
    disbursement_week: string | null;
    internal_source: string | null; // e.g. "Internal Disbursement #123"
    bank_source: string | null; // e.g. "Bank Statement #456"
    bank_date: Date;
    is_duplicate: boolean;
    status: ReconciliationStatus;
};

export type BankFileAuditType = {
    status: 'imported' | 'missing';
    month: string;
    month_key: string;
    file_name: string | null;
    import_job_id: number | null;
    record_count: number;
    total_debit: number;
    uploaded_at: string | null;
};

export type WeeklyLedgerAuditType = {
    week: number;
    status: 'imported' | 'missing';
    file_name: string | null;
    import_job_id: number | null;
    date_issued: string | null;
    record_count: number;
    total_amount: number;
    uploaded_at: string | null;
};

export type FileAuditStatsType = {
    has_date_filter: boolean;
    target_month: string;
    month_label: string;
    period_label: string;
    period_from: string;
    period_to: string;
    bank_file: BankFileAuditType;
    weekly_ledgers: WeeklyLedgerAuditType[];
    expected_weeks: number[];
    missing_weeks: number[];
    imported_weeks_count: number;
    total_expected_files: number;
    total_imported_files: number;
    missing_files_count: number;
    is_complete: boolean;
};