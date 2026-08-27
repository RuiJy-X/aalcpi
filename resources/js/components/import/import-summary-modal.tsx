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
    Calendar,
    DollarSign,
    Users,
    FileText,
    TrendingUp,
    RefreshCw,
    Trash2,
    Copy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
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
    new_rows_count?: number;
    exact_duplicates_count?: number;
    invalid_rows_count?: number;
    possible_duplicates_count?: number;
    updated_count?: number;
    replaced_count?: number;
    kept_both_count?: number;
    warnings?: string[];
    duplicate_count?: number;
    error?: string;
    file_name?: string;
    // Production & Weekly PDF Audit extensions
    crop_year?: string;
    week?: string;
    composite_sugar_price?: number | null;
    composite_molasses_price?: number | null;
    planters_created?: number;
    haciendas_created?: number;
    total_net_cw?: number;
    total_actual_lkg?: number;
    unique_planters?: number;
    extracted_planters?: string[];
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
    const exactDuplicatesCount = ctx.exact_duplicates_count ?? 0;
    const invalidRowsCount = ctx.invalid_rows_count ?? Math.max(0, rowsSkipped - exactDuplicatesCount);
    const updatedCount = ctx.updated_count ?? 0;
    const replacedCount = ctx.replaced_count ?? 0;
    const keptBothCount = ctx.kept_both_count ?? 0;
    const newRowsCount = ctx.new_rows_count ?? 0;
    const errorMsg = ctx.error || summary.message;

    const formatTypeName = (type: string) => {
        if (type.includes('internal')) return 'Internal Ledger';
        if (type.includes('bank')) return 'Bank Statement';
        if (type.includes('productions')) return 'Production Data (Excel)';
        if (type.includes('weekly')) return 'Weekly Planter Report (PDF)';
        if (type.includes('planter')) return 'Planter Masterlist';
        return type;
    };

    const hasWarnings = warnings.length > 0 || rowsSkipped > 0;
    const isFailed = summary.status === 'failed';
    const isProduction = summary.type.includes('productions');
    const isWeekly = summary.type.includes('weekly');

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="bg-card sm:max-w-xl max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg font-bold">
                        <FileCheck2 className="h-5 w-5 text-primary" />
                        Import Transparency & Audit Summary
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                        Audit report detailing processed records, duplicate resolutions, target parameters, and log.
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

                    {/* Target Context Info Banner (Crop Year, Week, Prices) */}
                    {(ctx.crop_year || ctx.week || ctx.composite_sugar_price != null || ctx.composite_molasses_price != null) && (
                        <div className="p-3 rounded-xl border bg-muted/30 grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                            {ctx.crop_year && (
                                <div className="flex items-center gap-1.5 font-medium text-foreground">
                                    <Calendar className="h-3.5 w-3.5 text-primary" />
                                    <span>Crop Year: <strong>{ctx.crop_year}</strong></span>
                                </div>
                            )}
                            {ctx.week && (
                                <div className="flex items-center gap-1.5 font-medium text-foreground">
                                    <FileText className="h-3.5 w-3.5 text-purple-500" />
                                    <span>Week No: <strong>{ctx.week}</strong></span>
                                </div>
                            )}
                            {ctx.composite_sugar_price != null && (
                                <div className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                                    <DollarSign className="h-3.5 w-3.5" />
                                    <span>Sugar Price: <strong>₱{Number(ctx.composite_sugar_price).toFixed(2)}</strong></span>
                                </div>
                            )}
                            {ctx.composite_molasses_price != null && (
                                <div className="flex items-center gap-1.5 font-medium text-amber-600 dark:text-amber-400">
                                    <DollarSign className="h-3.5 w-3.5" />
                                    <span>Molasses Price: <strong>₱{Number(ctx.composite_molasses_price).toFixed(2)}</strong></span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Transparency Metrics Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-3 rounded-lg bg-muted/50 border text-center space-y-1">
                            <span className="text-[11px] font-medium text-muted-foreground uppercase flex items-center justify-center gap-1">
                                <ListFilter className="h-3.5 w-3.5" /> Processed
                            </span>
                            <p className="text-lg font-bold text-foreground">{rowsRead.toLocaleString()}</p>
                            <span className="text-[9px] text-muted-foreground block">From Row {headingRow}</span>
                        </div>

                        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center space-y-1">
                            <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300 uppercase flex items-center justify-center gap-1">
                                <CheckCircle2 className="h-3.5 w-3.5" /> Saved / Updated
                            </span>
                            <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                                {rowsSaved.toLocaleString()}
                            </p>
                            <span className="text-[9px] text-emerald-600 dark:text-emerald-400 block">In Database</span>
                        </div>

                        <div className="p-3 rounded-lg bg-slate-500/10 border border-slate-500/20 text-center space-y-1">
                            <span className="text-[11px] font-medium text-muted-foreground uppercase flex items-center justify-center gap-1">
                                <Layers className="h-3.5 w-3.5" /> Exact Duplicates
                            </span>
                            <p className="text-lg font-bold text-muted-foreground">
                                {exactDuplicatesCount.toLocaleString()}
                            </p>
                            <span className="text-[9px] text-muted-foreground block">Auto-skipped</span>
                        </div>

                        <div
                            className={`p-3 rounded-lg border text-center space-y-1 ${
                                invalidRowsCount > 0
                                    ? 'bg-amber-500/10 border-amber-500/30'
                                    : 'bg-muted/50'
                            }`}
                        >
                            <span className="text-[11px] font-medium text-muted-foreground uppercase flex items-center justify-center gap-1">
                                <AlertCircle className="h-3.5 w-3.5" /> Invalid Rows
                            </span>
                            <p
                                className={`text-lg font-bold ${
                                    invalidRowsCount > 0
                                        ? 'text-amber-700 dark:text-amber-300'
                                        : 'text-foreground'
                                }`}
                            >
                                {invalidRowsCount.toLocaleString()}
                            </p>
                            <span className="text-[9px] text-muted-foreground block">Skipped</span>
                        </div>
                    </div>

                    {/* Duplicate Resolution Audit Breakdown */}
                    {(exactDuplicatesCount > 0 || updatedCount > 0 || replacedCount > 0 || keptBothCount > 0) && (
                        <div className="p-3 rounded-xl border bg-muted/30 space-y-2 text-xs">
                            <p className="font-semibold text-foreground flex items-center gap-1.5">
                                <Info className="h-3.5 w-3.5 text-primary" />
                                Duplicate Handling & Resolution Audit:
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                <div className="p-2 rounded bg-background border text-center">
                                    <span className="text-[10px] text-muted-foreground block">Exact Duplicates</span>
                                    <strong className="text-foreground">{exactDuplicatesCount} (Skipped)</strong>
                                </div>
                                {updatedCount > 0 && (
                                    <div className="p-2 rounded bg-background border text-center">
                                        <span className="text-[10px] text-muted-foreground block flex items-center justify-center gap-1">
                                            <RefreshCw className="h-2.5 w-2.5" /> Updated
                                        </span>
                                        <strong className="text-foreground">{updatedCount}</strong>
                                    </div>
                                )}
                                {keptBothCount > 0 && (
                                    <div className="p-2 rounded bg-background border text-center">
                                        <span className="text-[10px] text-muted-foreground block flex items-center justify-center gap-1">
                                            <Copy className="h-2.5 w-2.5" /> Kept Both
                                        </span>
                                        <strong className="text-foreground">{keptBothCount}</strong>
                                    </div>
                                )}
                                {replacedCount > 0 && (
                                    <div className="p-2 rounded bg-background border text-center">
                                        <span className="text-[10px] text-destructive block flex items-center justify-center gap-1">
                                            <Trash2 className="h-2.5 w-2.5" /> Replaced
                                        </span>
                                        <strong className="text-destructive">{replacedCount}</strong>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Production Specific Summary Stats */}
                    {isProduction && (ctx.planters_created != null || ctx.haciendas_created != null || ctx.total_net_cw != null) && (
                        <div className="p-3 rounded-xl border bg-blue-500/5 space-y-2">
                            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                                <TrendingUp className="h-4 w-4" />
                                Production Import Metrics & Masterlist Updates:
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                                {ctx.planters_created != null && (
                                    <div className="p-2 rounded bg-background border text-center">
                                        <span className="text-[10px] text-muted-foreground block">New Planters</span>
                                        <strong className="text-foreground">{ctx.planters_created}</strong>
                                    </div>
                                )}
                                {ctx.haciendas_created != null && (
                                    <div className="p-2 rounded bg-background border text-center">
                                        <span className="text-[10px] text-muted-foreground block">New Haciendas</span>
                                        <strong className="text-foreground">{ctx.haciendas_created}</strong>
                                    </div>
                                )}
                                {ctx.total_net_cw != null && (
                                    <div className="p-2 rounded bg-background border text-center">
                                        <span className="text-[10px] text-muted-foreground block">Total Net CW</span>
                                        <strong className="text-foreground">{ctx.total_net_cw.toLocaleString()}</strong>
                                    </div>
                                )}
                                {ctx.total_actual_lkg != null && (
                                    <div className="p-2 rounded bg-background border text-center">
                                        <span className="text-[10px] text-muted-foreground block">Total Actual Lkg</span>
                                        <strong className="text-foreground">{ctx.total_actual_lkg.toLocaleString()}</strong>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Weekly PDF Specific Summary Stats */}
                    {isWeekly && (ctx.unique_planters != null || (ctx.extracted_planters && ctx.extracted_planters.length > 0)) && (
                        <div className="p-3 rounded-xl border bg-purple-500/5 space-y-2">
                            <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                                <Users className="h-4 w-4" />
                                Extracted Planter Documents ({ctx.unique_planters ?? ctx.extracted_planters?.length}):
                            </p>
                            {ctx.extracted_planters && ctx.extracted_planters.length > 0 && (
                                <div className="max-h-32 overflow-y-auto p-2 rounded bg-background border text-[11px] font-mono space-y-1">
                                    {ctx.extracted_planters.map((p, idx) => (
                                        <div key={idx} className="text-muted-foreground truncate">
                                            • {p}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Detected Headers */}
                    {headers.length > 0 && (
                        <div className="space-y-1.5 p-3 rounded-xl border bg-background">
                            <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                <Info className="h-3.5 w-3.5 text-primary" />
                                Headers / Fields Extracted:
                            </p>
                            <div className="flex flex-wrap gap-1.5 pt-1 max-h-24 overflow-y-auto">
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
                                <strong>{duplicateCount} record(s)</strong> share check numbers across the system and have duplicate flags enabled.
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
