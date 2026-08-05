import React from 'react';
import {
    FileCheck2,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    FileSpreadsheet,
    Building2,
    Layers,
    ListFilter,
    AlertCircle,
    Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

export type ImportAuditContext = {
    heading_row?: number;
    headers_read?: string[];
    mapping_used?: Record<string, string>;
    rows_read?: number;
    rows_saved?: number;
    rows_skipped?: number;
    warnings?: string[];
    duplicate_count?: number;
    error?: string;
    file_name?: string;
};

export type ImportSummaryData = {
    id: number;
    type: string;
    status: 'queued' | 'running' | 'done' | 'failed';
    message: string | null;
    context?: ImportAuditContext;
};

interface ImportSummaryModalProps {
    isOpen: boolean;
    onClose: () => void;
    summary: ImportSummaryData | null;
}

export function ImportSummaryModal({ isOpen, onClose, summary }: ImportSummaryModalProps) {
    if (!summary) return null;

    const ctx = summary.context ?? {};
    const headingRow = ctx.heading_row ?? (summary.type.includes('internal') ? 6 : 1);
    const headers = ctx.headers_read ?? [];
    const rowsRead = ctx.rows_read ?? 0;
    const rowsSaved = ctx.rows_saved ?? 0;
    const rowsSkipped = ctx.rows_skipped ?? 0;
    const warnings = ctx.warnings ?? [];
    const duplicateCount = ctx.duplicate_count ?? 0;
    const errorMsg = ctx.error || summary.message;

    const formatTypeName = (type: string) => {
        if (type.includes('internal')) return 'Internal Ledger';
        if (type.includes('bank')) return 'Bank Statement';
        return type;
    };

    const hasWarnings = warnings.length > 0 || rowsSkipped > 0;
    const isFailed = summary.status === 'failed';

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="bg-card sm:max-w-xl max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg font-bold">
                        <FileCheck2 className="h-5 w-5 text-primary" />
                        Import Transparency & Audit Summary
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                        Audit report detailing rows processed, header starting row, mapped fields, and warnings.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-1">
                    {/* Status Overview Banner */}
                    <div
                        className={`p-3.5 rounded-xl border flex items-center justify-between ${
                            isFailed
                                ? 'bg-destructive/10 border-destructive/30 text-destructive'
                                : hasWarnings
                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
                                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                        }`}
                    >
                        <div className="flex items-center gap-2.5">
                            {isFailed ? (
                                <XCircle className="h-5 w-5 shrink-0" />
                            ) : hasWarnings ? (
                                <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                            ) : (
                                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                            )}
                            <div>
                                <p className="font-semibold text-sm">
                                    {isFailed
                                        ? 'Import Failed'
                                        : hasWarnings
                                        ? 'Import Complete with Warnings'
                                        : 'Import Successfully Completed'}
                                </p>
                                <p className="text-xs opacity-90">
                                    {formatTypeName(summary.type)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Transparency Metrics Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-3 rounded-lg bg-muted/50 border text-center space-y-1">
                            <span className="text-[11px] font-medium text-muted-foreground uppercase flex items-center justify-center gap-1">
                                <Layers className="h-3.5 w-3.5" /> Start Row
                            </span>
                            <p className="text-lg font-bold text-foreground">Row {headingRow}</p>
                        </div>

                        <div className="p-3 rounded-lg bg-muted/50 border text-center space-y-1">
                            <span className="text-[11px] font-medium text-muted-foreground uppercase flex items-center justify-center gap-1">
                                <ListFilter className="h-3.5 w-3.5" /> Rows Read
                            </span>
                            <p className="text-lg font-bold text-foreground">{rowsRead.toLocaleString()}</p>
                        </div>

                        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center space-y-1">
                            <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300 uppercase flex items-center justify-center gap-1">
                                <CheckCircle2 className="h-3.5 w-3.5" /> Saved
                            </span>
                            <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                                {rowsSaved.toLocaleString()}
                            </p>
                        </div>

                        <div
                            className={`p-3 rounded-lg border text-center space-y-1 ${
                                rowsSkipped > 0
                                    ? 'bg-amber-500/10 border-amber-500/30'
                                    : 'bg-muted/50'
                            }`}
                        >
                            <span className="text-[11px] font-medium text-muted-foreground uppercase flex items-center justify-center gap-1">
                                <AlertCircle className="h-3.5 w-3.5" /> Skipped
                            </span>
                            <p
                                className={`text-lg font-bold ${
                                    rowsSkipped > 0
                                        ? 'text-amber-700 dark:text-amber-300'
                                        : 'text-foreground'
                                }`}
                            >
                                {rowsSkipped.toLocaleString()}
                            </p>
                        </div>
                    </div>

                    {/* Detected Headers */}
                    {headers.length > 0 && (
                        <div className="space-y-1.5 p-3 rounded-xl border bg-background">
                            <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                <Info className="h-3.5 w-3.5 text-primary" />
                                Headers Extracted from Row {headingRow}:
                            </p>
                            <div className="flex flex-wrap gap-1.5 pt-1">
                                {headers.map((h, i) => (
                                    <span
                                        key={i}
                                        className="text-[11px] font-mono px-2 py-0.5 rounded bg-muted border text-muted-foreground"
                                    >
                                        {h}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Duplicate Info */}
                    {duplicateCount > 0 && (
                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                            <span>
                                <strong>{duplicateCount} record(s)</strong> share a check number with existing entries and have been flagged with duplicate badges.
                            </span>
                        </div>
                    )}

                    {/* Warnings & Ignored Rows Log */}
                    {warnings.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                Ignored Rows & Warning Log ({warnings.length}):
                            </p>
                            <div className="max-h-40 overflow-y-auto p-2.5 rounded-xl border bg-amber-500/5 text-xs font-mono space-y-1 text-amber-900 dark:text-amber-100">
                                {warnings.map((w, idx) => (
                                    <p key={idx} className="leading-relaxed border-b border-amber-500/10 pb-1 last:border-0 last:pb-0">
                                        • {w}
                                    </p>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Failed Error Log */}
                    {isFailed && errorMsg && (
                        <div className="space-y-2">
                            <p className="text-xs font-semibold text-destructive flex items-center gap-1.5">
                                <XCircle className="h-4 w-4" />
                                Execution Failure Message:
                            </p>
                            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-xs font-mono text-destructive break-words">
                                {errorMsg}
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button onClick={onClose}>Close Report</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
