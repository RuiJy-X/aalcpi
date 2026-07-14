<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * bank_date was added to the original create_bank_statements migration after
 * some environments had already run it, so those databases are missing the
 * column. The reconciliation_workspace view depends on it.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('bank_statements', 'bank_date')) {
            Schema::table('bank_statements', function (Blueprint $table) {
                $table->date('bank_date')->nullable();
            });
        }

        // Recreate the view so SQLite (and others) re-resolve column references
        // against the updated bank_statements schema.
        $this->createReconciliationWorkspaceView();
    }

    public function down(): void
    {
        // Do not drop bank_date: the create migration expects it, and fresh
        // installs already include it there. Only leave the view as-is.
    }

    private function createReconciliationWorkspaceView(): void
    {
        DB::statement('DROP VIEW IF EXISTS reconciliation_workspace');

        $driver = Schema::getConnection()->getDriverName();

        $daysOutstandingExpr = $driver === 'pgsql'
            ? '(CURRENT_DATE - internal_disbursements.date_issued)'
            : "CAST(julianday('now') - julianday(internal_disbursements.date_issued) AS INTEGER)";

        DB::statement("
            CREATE VIEW reconciliation_workspace AS

            -- 1. Internal disbursements (Matched, Mismatched, Outstanding)
            SELECT
                internal_disbursements.id AS source_id,
                'internal' AS source,
                CASE
                    WHEN internal_disbursements.bank_statement_id IS NOT NULL THEN bank_statements.tdate
                    ELSE NULL
                END AS transaction_date,
                internal_disbursements.check_no AS ref_no,
                internal_disbursements.payee_name AS description,
                internal_disbursements.check_amount AS internal_amount,
                bank_statements.debit AS bank_amount,
                internal_job.file_name AS internal_source,
                bank_job.file_name AS bank_source,
                CASE
                    WHEN internal_disbursements.bank_statement_id IS NOT NULL
                    THEN bank_statements.bank_date
                    ELSE NULL
                END AS bank_date,
                internal_disbursements.date_issued AS internal_date_issued,
                internal_disbursements.disbursement_week AS disbursement_week,
                CASE
                    WHEN internal_disbursements.bank_statement_id IS NOT NULL
                    THEN internal_disbursements.check_amount - bank_statements.debit
                    ELSE NULL
                END AS variance,
                CASE
                    WHEN internal_disbursements.bank_statement_id IS NULL
                    THEN {$daysOutstandingExpr}
                    ELSE NULL
                END AS days_outstanding,
                internal_disbursements.is_duplicate AS is_duplicate,
                CASE
                    WHEN internal_disbursements.bank_statement_id IS NULL THEN 'Outstanding'
                    WHEN internal_disbursements.check_amount = bank_statements.debit THEN 'Matched'
                    ELSE 'Amount Mismatch'
                END AS status
            FROM internal_disbursements
            LEFT JOIN bank_statements ON bank_statements.id = internal_disbursements.bank_statement_id
            LEFT JOIN import_jobs AS internal_job ON internal_job.id = internal_disbursements.import_job_id
            LEFT JOIN import_jobs AS bank_job ON bank_job.id = bank_statements.import_job_id

            UNION ALL

            -- 2. Unmatched bank entries (Unrecorded Bank Entry)
            SELECT
                bank_statements.id AS source_id,
                'bank' AS source,
                bank_statements.tdate AS transaction_date,
                COALESCE(bank_statements.checkno, 'N/A') AS ref_no,
                COALESCE(bank_statements.partic, bank_statements.branch_description) AS description,
                NULL AS internal_amount,
                bank_statements.debit AS bank_amount,
                NULL AS internal_source,
                bank_job.file_name AS bank_source,
                bank_statements.bank_date AS bank_date,
                NULL AS internal_date_issued,
                NULL AS disbursement_week,
                NULL AS variance,
                NULL AS days_outstanding,
                bank_statements.is_duplicate AS is_duplicate,
                'Unrecorded Bank Entry' AS status
            FROM bank_statements
            LEFT JOIN import_jobs AS bank_job ON bank_job.id = bank_statements.import_job_id
            WHERE NOT EXISTS (
                SELECT 1 FROM internal_disbursements WHERE internal_disbursements.bank_statement_id = bank_statements.id
            )
        ");
    }
};
