import React from 'react';
import { Link } from '@inertiajs/react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Building2,
    Calendar,
    CheckCircle2,
    Clock,
    FileSpreadsheet,
    FileText,
    History,
    Plus,
    TriangleAlert,
} from 'lucide-react';
import type { FileAuditStatsType } from '../bank-recon-types';

interface ImportedFilesModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    fileAuditStats?: FileAuditStatsType;
    onImportMissing: (type: 'internal' | 'bank', week?: number) => void;
}

export function ImportedFilesModal({
    open,
    onOpenChange,
    fileAuditStats,
    onImportMissing,
}: ImportedFilesModalProps) {
    if (!fileAuditStats) {
        return null;
    }

    const {
        period_label,
        month_label,
        bank_file,
        weekly_ledgers,
        total_expected_files,
        total_imported_files,
        is_complete,
    } = fileAuditStats;

    const completionPercentage = Math.round(
        (total_imported_files / Math.max(1, total_expected_files)) * 100,
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[85vh] sm:max-w-2xl overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between pr-4">
                        <DialogTitle className="text-lg font-semibold">
                            Dataset Files & Completeness Audit
                        </DialogTitle>
                        <Badge
                            variant={is_complete ? 'default' : 'secondary'}
                            className={
                                is_complete
                                    ? 'bg-emerald-600 hover:bg-emerald-600 text-white'
                                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                            }
                        >
                            {is_complete
                                ? 'All Files Present (100%)'
                                : `${total_imported_files}/${total_expected_files} Files Loaded (${completionPercentage}%)`}
                        </Badge>
                    </div>
                    <DialogDescription className="text-xs text-muted-foreground">
                        Standard monthly reconciliation requires <span className="font-semibold text-foreground">1 Bank Statement</span> and <span className="font-semibold text-foreground">4 Weekly Summary Ledgers</span> (Weeks 1 to 4).
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 pt-2">
                    {/* Period & Progress Banner */}
                    <div className="rounded-xl border bg-muted/40 p-3.5 text-xs">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 font-medium">
                                <Calendar className="h-4 w-4 text-primary" />
                                <span>Target Cycle / Filtered Period:</span>
                                <span className="font-semibold text-foreground">
                                    {period_label}
                                </span>
                            </div>
                            <span className="text-muted-foreground font-mono">
                                {total_imported_files} / {total_expected_files} Expected Files
                            </span>
                        </div>
                        <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                            <div
                                className={`h-full transition-all duration-300 ${
                                    is_complete
                                        ? 'bg-emerald-500'
                                        : completionPercentage >= 50
                                        ? 'bg-amber-500'
                                        : 'bg-destructive'
                                }`}
                                style={{ width: `${completionPercentage}%` }}
                            />
                        </div>
                    </div>

                    {/* 1. Monthly Bank Statement Section */}
                    <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                            <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                <Building2 className="h-3.5 w-3.5" />
                                1. Monthly Bank Statement (1 Required per Month)
                            </h4>
                            <span className="text-[11px] text-muted-foreground">
                                Cycle: {month_label}
                            </span>
                        </div>

                        <div
                            className={`rounded-xl border p-4 transition-all ${
                                bank_file.status === 'imported'
                                    ? 'border-emerald-500/30 bg-emerald-500/5'
                                    : 'border-amber-500/40 bg-amber-500/5'
                            }`}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        {bank_file.status === 'imported' ? (
                                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                        ) : (
                                            <TriangleAlert className="h-4 w-4 text-amber-600" />
                                        )}
                                        <p className="font-semibold text-sm text-foreground">
                                            {bank_file.status === 'imported'
                                                ? bank_file.file_name || `${month_label} Bank Statement`
                                                : `Missing Bank Statement for ${month_label}`}
                                        </p>
                                        <Badge
                                            variant="outline"
                                            className={`text-[10px] uppercase font-bold ${
                                                bank_file.status === 'imported'
                                                    ? 'border-emerald-600/30 bg-emerald-100/70 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                                    : 'border-amber-600/30 bg-amber-100/70 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                            }`}
                                        >
                                            {bank_file.status === 'imported' ? 'Imported' : 'Missing File'}
                                        </Badge>
                                    </div>

                                    {bank_file.status === 'imported' ? (
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-xs text-muted-foreground">
                                            <span>
                                                Records:{' '}
                                                <strong className="text-foreground">
                                                    {bank_file.record_count.toLocaleString()}
                                                </strong>
                                            </span>
                                            {bank_file.uploaded_at && (
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {bank_file.uploaded_at}
                                                </span>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-muted-foreground pt-1">
                                            No bank statement has been uploaded for {month_label}. Upload the raw bank statement export to reconcile.
                                        </p>
                                    )}
                                </div>

                                {bank_file.status === 'missing' && (
                                    <Button
                                        size="sm"
                                        className="shrink-0 gap-1.5"
                                        onClick={() => {
                                            onOpenChange(false);
                                            onImportMissing('bank');
                                        }}
                                    >
                                        <Plus className="h-3.5 w-3.5" />
                                        Import Statement
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 2. Weekly Summary Ledgers Section */}
                    <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                            <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                <FileSpreadsheet className="h-3.5 w-3.5" />
                                2. Weekly Summary Ledgers (4 Weeks per Month)
                            </h4>
                            <span className="text-[11px] font-medium text-muted-foreground">
                                {weekly_ledgers.filter((w) => w.status === 'imported').length} of {weekly_ledgers.length} Weeks Uploaded
                            </span>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {weekly_ledgers.map((weekItem) => (
                                <div
                                    key={weekItem.week}
                                    className={`flex flex-col justify-between rounded-xl border p-3.5 transition-all ${
                                        weekItem.status === 'imported'
                                            ? 'border-emerald-500/30 bg-emerald-500/5'
                                            : 'border-dashed border-amber-500/40 bg-card'
                                    }`}
                                >
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold text-xs text-foreground">
                                                Week {weekItem.week} Summary Ledger
                                            </span>
                                            <Badge
                                                variant="outline"
                                                className={`text-[10px] font-bold uppercase ${
                                                    weekItem.status === 'imported'
                                                        ? 'border-emerald-600/30 bg-emerald-100/70 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                                        : 'border-amber-600/30 bg-amber-100/70 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                                }`}
                                            >
                                                {weekItem.status === 'imported' ? 'Imported' : 'Missing'}
                                            </Badge>
                                        </div>

                                        {weekItem.status === 'imported' ? (
                                            <div className="space-y-1 text-xs text-muted-foreground">
                                                <p className="truncate font-medium text-foreground">
                                                    {weekItem.file_name || `Disbursements Week ${weekItem.week}.xlsx`}
                                                </p>
                                                <div className="flex items-center justify-between pt-0.5 text-[11px]">
                                                    <span>
                                                        Rows: <strong className="text-foreground">{weekItem.record_count.toLocaleString()}</strong>
                                                    </span>
                                                    {weekItem.date_issued && (
                                                        <span>Issued: {weekItem.date_issued}</span>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-muted-foreground">
                                                No summary ledger uploaded for Week {weekItem.week}.
                                            </p>
                                        )}
                                    </div>

                                    {weekItem.status === 'missing' && (
                                        <div className="pt-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="w-full gap-1.5 text-xs font-medium border-amber-500/40 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                                                onClick={() => {
                                                    onOpenChange(false);
                                                    onImportMissing('internal', weekItem.week);
                                                }}
                                            >
                                                <Plus className="h-3.5 w-3.5 text-amber-600" />
                                                Import Week {weekItem.week}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex items-center justify-between border-t pt-3 sm:justify-between">
                    <Button variant="ghost" size="sm" asChild className="gap-2 text-xs">
                        <Link href="/Imports/history?type=bank_recon">
                            <History className="h-3.5 w-3.5" />
                            View Full Import History
                        </Link>
                    </Button>
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => onOpenChange(false)}
                    >
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
