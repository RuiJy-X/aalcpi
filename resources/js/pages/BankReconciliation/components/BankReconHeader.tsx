import React from 'react';
import { Link } from '@inertiajs/react';
import { Landmark, FolderSearch, History, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BankReconImportDialog } from '../BankReconImportDialog';
import { PrintOutstandingChecksDialog } from '../PrintOutstandingChecksDialog';
import type { FileAuditStatsType } from '../bank-recon-types';

interface BankReconHeaderProps {
    fileAuditStats?: FileAuditStatsType;
    onOpenFilesModal: () => void;
    onOpenClearModal: () => void;
    periodFrom?: string;
    periodTo?: string;
}

export function BankReconHeader({
    fileAuditStats,
    onOpenFilesModal,
    onOpenClearModal,
    periodFrom,
    periodTo,
}: BankReconHeaderProps) {
    const totalImported = fileAuditStats?.total_imported_files ?? 0;
    const totalExpected = fileAuditStats?.total_expected_files ?? 5;

    return (
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary shadow-xs">
                    <Landmark className="h-6 w-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                        Bank Reconciliation
                    </h1>
                    <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
                        Reconcile internal disbursements with bank statements, identify discrepancies, and verify audit completeness.
                    </p>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                <Button
                    variant="outline"
                    onClick={onOpenFilesModal}
                    className="h-9 gap-2 text-xs font-semibold shadow-xs"
                >
                    <FolderSearch className="h-4 w-4 text-primary" />
                    <span>File Status</span>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
                        {totalImported}/{totalExpected}
                    </span>
                </Button>

                <Button
                    variant="outline"
                    asChild
                    className="h-9 gap-2 text-xs font-semibold shadow-xs"
                >
                    <Link href="/Imports/history?type=bank_recon">
                        <History className="h-4 w-4" />
                        <span>Import History</span>
                    </Link>
                </Button>

                <PrintOutstandingChecksDialog
                    defaultPeriodFrom={periodFrom}
                    defaultPeriodTo={periodTo}
                />

                <BankReconImportDialog />

                <Button
                    variant="destructive"
                    size="sm"
                    onClick={onOpenClearModal}
                    className="h-9 gap-1.5 text-xs font-semibold shadow-xs"
                >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete All</span>
                </Button>
            </div>
        </div>
    );
}
