<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("
            CREATE VIEW reconciliation_workspace AS
            
        -- 1. Grab everything from internal disbursements (Matched, Mismatched, Outstanding)
            SELECT 
                id AS source_id,
                'internal' AS source,
                created_at AS transaction_date,
                check_no AS ref_no,
                payee_name AS description,
                check_amount AS internal_amount,
                (SELECT debit FROM bank_statements WHERE bank_statements.id = internal_disbursements.bank_statement_id) AS bank_amount,
                CASE 
                    WHEN bank_statement_id IS NULL THEN 'Outstanding'
                    WHEN check_amount = (SELECT debit FROM bank_statements WHERE bank_statements.id = internal_disbursements.bank_statement_id) THEN 'Matched'
                    ELSE 'Amount Mismatch'
                END AS status
            FROM internal_disbursements

            UNION ALL

            -- 2. Grab unmatched entries from bank statements (Unrecorded Bank Entry)
            SELECT 
                id AS source_id,
                'bank' AS source,
                tdate AS transaction_date,
                COALESCE(checkno, 'N/A') AS ref_no,
                COALESCE(partic, branch_description) AS description,
                NULL AS internal_amount,
                COALESCE(debit, credit) AS bank_amount,
                'Unrecorded Bank Entry' AS status
            FROM bank_statements
            WHERE NOT EXISTS (
                SELECT 1 FROM internal_disbursements WHERE internal_disbursements.bank_statement_id = bank_statements.id
            )
        ");
    }

    public function down(): void
    {
        DB::statement("DROP VIEW IF EXISTS reconciliation_workspace");
    }
};