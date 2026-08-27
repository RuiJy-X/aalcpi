import React, { useState } from 'react';
import {
    FileCheck2,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Info,
    Layers,
    ListFilter,
    AlertCircle,
    ArrowRight,
    RefreshCw,
    Copy,
    Trash2,
    ShieldAlert,
    ChevronDown,
    ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface PossibleDuplicateDiff {
    field: string;
    label: string;
    existing: string;
    imported: string;
}

export interface PossibleDuplicateItem {
    row_id: string;
    row_number: number;
    identifier: string;
    existing_id?: number | null;
    existing_record?: Record<string, unknown> | null;
    imported_record?: Record<string, unknown> | null;
    differences: PossibleDuplicateDiff[];
    default_action?: 'update' | 'keep_both' | 'replace';
}

export interface PreImportAnalysisResult {
    analysis_token: string;
    file_name: string;
    type: 'internal' | 'bank' | string;
    heading_row: number;
    headers_read: string[];
    total_rows: number;
    new_rows_count: number;
    exact_duplicates_count: number;
    possible_duplicates_count: number;
    invalid_rows_count: number;
    possible_duplicates: PossibleDuplicateItem[];
    new_rows_sample: Array<Record<string, unknown>>;
    exact_duplicates_sample: Array<Record<string, unknown>>;
    invalid_rows: Array<{ row_number: number; reason: string }>;
}

interface ImportAuditPreviewStepProps {
    analysis: PreImportAnalysisResult;
    resolutions: Record<string, 'update' | 'keep_both' | 'replace'>;
    onResolutionsChange: (resolutions: Record<string, 'update' | 'keep_both' | 'replace'>) => void;
    onConfirm: () => void;
    onBack: () => void;
    isSubmitting: boolean;
}

export function ImportAuditPreviewStep({
    analysis,
    resolutions,
    onResolutionsChange,
    onConfirm,
    onBack,
    isSubmitting,
}: ImportAuditPreviewStepProps) {
    const [showExactDuplicates, setShowExactDuplicates] = useState(false);
    const [showInvalidRows, setShowInvalidRows] = useState(false);

    const handleSingleResolutionChange = (
        rowId: string,
        action: 'update' | 'keep_both' | 'replace',
    ) => {
        onResolutionsChange({
            ...resolutions,
            [rowId]: action,
        });
    };

    const handleBatchResolution = (action: 'update' | 'keep_both' | 'replace') => {
        const next: Record<string, 'update' | 'keep_both' | 'replace'> = {};
        analysis.possible_duplicates.forEach((item) => {
            next[item.row_id] = action;
        });
        onResolutionsChange(next);
    };

    const hasReplaceAction = Object.values(resolutions).some(
        (action) => action === 'replace',
    );

    return (
        <div className="space-y-4 py-1 text-xs">
            {/* Header Title */}
            <div className="flex items-center justify-between border-b pb-2">
                <div>
                    <h3 className="text-sm font-semibold flex items-center gap-1.5 text-foreground">
                        <FileCheck2 className="h-4 w-4 text-primary" />
                        Pre-Import Audit & Duplicate Inspection
                    </h3>
                    <p className="text-muted-foreground text-[11px] mt-0.5">
                        Verify file analysis metrics below before writing records to the database.
                    </p>
                </div>
                <Badge variant="outline" className="font-mono text-[11px]">
                    {analysis.file_name}
                </Badge>
            </div>

            {/* Audit KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                <div className="p-2.5 rounded-lg border bg-muted/40 text-center">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground flex items-center justify-center gap-1">
                        <ListFilter className="h-3 w-3" /> Total Rows
                    </span>
                    <p className="text-base font-bold text-foreground mt-0.5">
                        {analysis.total_rows.toLocaleString()}
                    </p>
                </div>

                <div className="p-2.5 rounded-lg border bg-emerald-500/10 border-emerald-500/20 text-center">
                    <span className="text-[10px] uppercase font-semibold text-emerald-700 dark:text-emerald-300 flex items-center justify-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> New Rows
                    </span>
                    <p className="text-base font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">
                        {analysis.new_rows_count.toLocaleString()}
                    </p>
                </div>

                <div className="p-2.5 rounded-lg border bg-slate-500/10 border-slate-500/20 text-center">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground flex items-center justify-center gap-1">
                        <Layers className="h-3 w-3" /> Exact Duplicates
                    </span>
                    <p className="text-base font-bold text-muted-foreground mt-0.5">
                        {analysis.exact_duplicates_count.toLocaleString()}
                    </p>
                    <span className="text-[9px] text-muted-foreground block">Auto-skipped</span>
                </div>

                <div
                    className={`p-2.5 rounded-lg border text-center ${
                        analysis.possible_duplicates_count > 0
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-200'
                            : 'bg-muted/40 text-muted-foreground'
                    }`}
                >
                    <span className="text-[10px] uppercase font-semibold flex items-center justify-center gap-1">
                        <AlertTriangle className="h-3 w-3 text-amber-600 dark:text-amber-400" /> Possible Dups
                    </span>
                    <p className="text-base font-bold mt-0.5">
                        {analysis.possible_duplicates_count.toLocaleString()}
                    </p>
                    <span className="text-[9px] block">
                        {analysis.possible_duplicates_count > 0 ? 'Action Needed' : 'None'}
                    </span>
                </div>

                <div
                    className={`p-2.5 rounded-lg border text-center ${
                        analysis.invalid_rows_count > 0
                            ? 'bg-destructive/10 border-destructive/30 text-destructive'
                            : 'bg-muted/40 text-muted-foreground'
                    }`}
                >
                    <span className="text-[10px] uppercase font-semibold flex items-center justify-center gap-1">
                        <AlertCircle className="h-3 w-3" /> Invalid / Skipped
                    </span>
                    <p className="text-base font-bold mt-0.5">
                        {analysis.invalid_rows_count.toLocaleString()}
                    </p>
                    <span className="text-[9px] block">
                        {analysis.invalid_rows_count > 0 ? 'Will Skip' : 'Clean'}
                    </span>
                </div>
            </div>

            {/* Exact Duplicates Notice */}
            {analysis.exact_duplicates_count > 0 && (
                <div className="rounded-lg border bg-slate-500/5 p-2.5 flex items-start justify-between text-xs">
                    <div className="flex items-start gap-2">
                        <Info className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold text-foreground">
                                {analysis.exact_duplicates_count} Exact Duplicate(s) Detected
                            </p>
                            <p className="text-muted-foreground text-[11px]">
                                These records already match existing database transactions on all key business fields and will be <strong>automatically skipped</strong> to prevent duplicated entries.
                            </p>
                        </div>
                    </div>
                    {analysis.exact_duplicates_sample.length > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-[11px] px-2"
                            onClick={() => setShowExactDuplicates(!showExactDuplicates)}
                        >
                            {showExactDuplicates ? 'Hide' : 'View Sample'}
                        </Button>
                    )}
                </div>
            )}

            {/* Exact Duplicates Sample Accordion */}
            {showExactDuplicates && analysis.exact_duplicates_sample.length > 0 && (
                <div className="rounded-lg border bg-muted/20 p-2.5 space-y-1.5 max-h-36 overflow-y-auto font-mono text-[11px]">
                    <p className="font-sans font-semibold text-muted-foreground text-[11px]">
                        Sample rows from your spreadsheet that already exist identically in the database (each will be safely skipped):
                    </p>
                    {analysis.exact_duplicates_sample.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between border-b pb-1 last:border-0">
                            <span>
                                File Row {item.row_number}: Check #{item.check_no || item.checkno} • {item.payee_name || item.partic || 'Transaction'}
                                {item.matched_existing_id ? (
                                    <span className="text-[10px] text-muted-foreground ml-1.5">(Matches existing DB record #{String(item.matched_existing_id)})</span>
                                ) : item.matched_prior_row ? (
                                    <span className="text-[10px] text-amber-600 dark:text-amber-400 ml-1.5">(Duplicate of earlier Row #{String(item.matched_prior_row)} in this file)</span>
                                ) : null}
                            </span>
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                ₱{Number(item.check_amount || item.debit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* Possible Duplicates Resolution Interface */}
            {analysis.possible_duplicates.length > 0 && (
                <div className="space-y-2.5 pt-1">
                    <div className="flex items-center justify-between border-b pb-2">
                        <div>
                            <p className="font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-1.5 text-xs">
                                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                Resolve Possible Duplicates ({analysis.possible_duplicates.length})
                            </p>
                            <p className="text-muted-foreground text-[11px]">
                                These records share an identifier (check number/date) with existing data, but some field values differ. Choose how to handle each:
                            </p>
                        </div>
                        {/* Quick Batch Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] text-muted-foreground mr-1">Set All:</span>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-6 text-[10px] px-2"
                                onClick={() => handleBatchResolution('update')}
                            >
                                Update All
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-6 text-[10px] px-2"
                                onClick={() => handleBatchResolution('keep_both')}
                            >
                                Keep All
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-6 text-[10px] px-2 text-destructive hover:text-destructive"
                                onClick={() => handleBatchResolution('replace')}
                            >
                                Replace All
                            </Button>
                        </div>
                    </div>

                    {/* Replace Warning Alert */}
                    {hasReplaceAction && (
                        <div className="p-2.5 rounded-lg border bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs flex items-start gap-2">
                            <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                            <div>
                                <strong className="font-semibold">Notice regarding 'Replace' action:</strong> Replacing an existing record overwrites all its data and resets any prior bank reconciliation match link so that it re-evaluates fresh.
                            </div>
                        </div>
                    )}

                    {/* List of Possible Duplicate Cards */}
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {analysis.possible_duplicates.map((dup) => {
                            const currentAction = resolutions[dup.row_id] || dup.default_action || 'update';

                            return (
                                <div
                                    key={dup.row_id}
                                    className="p-3 rounded-lg border bg-card hover:bg-muted/10 space-y-2 transition-colors"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="font-mono text-[10px]">
                                                Row {dup.row_number}
                                            </Badge>
                                            <span className="font-semibold text-foreground text-xs">
                                                {dup.identifier}
                                            </span>
                                            {dup.existing_record && (
                                                <span className="text-[11px] text-muted-foreground">
                                                    (DB Record #{dup.existing_record.id as number})
                                                </span>
                                            )}
                                        </div>

                                        {/* Action Selector Buttons */}
                                        <div className="flex items-center gap-1">
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant={currentAction === 'update' ? 'default' : 'outline'}
                                                className="h-6 text-[10px] px-2.5"
                                                onClick={() => handleSingleResolutionChange(dup.row_id, 'update')}
                                            >
                                                <RefreshCw className="h-3 w-3 mr-1" />
                                                Update
                                            </Button>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant={currentAction === 'keep_both' ? 'secondary' : 'outline'}
                                                className="h-6 text-[10px] px-2.5"
                                                onClick={() => handleSingleResolutionChange(dup.row_id, 'keep_both')}
                                            >
                                                <Copy className="h-3 w-3 mr-1" />
                                                Keep Both
                                            </Button>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant={currentAction === 'replace' ? 'destructive' : 'outline'}
                                                className="h-6 text-[10px] px-2.5"
                                                onClick={() => handleSingleResolutionChange(dup.row_id, 'replace')}
                                            >
                                                <Trash2 className="h-3 w-3 mr-1" />
                                                Replace
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Field Differences Table / Grid */}
                                    <div className="rounded bg-muted/40 p-2 text-[11px] space-y-1">
                                        <div className="grid grid-cols-3 font-semibold text-muted-foreground border-b pb-1 text-[10px]">
                                            <span>Field</span>
                                            <span>Existing in ALCPi</span>
                                            <span>Imported from File</span>
                                        </div>
                                        {dup.differences.map((diff, dIdx) => (
                                            <div key={dIdx} className="grid grid-cols-3 py-0.5 items-center">
                                                <span className="font-medium text-foreground">{diff.label}</span>
                                                <span className="text-muted-foreground truncate">{diff.existing || '—'}</span>
                                                <span className="font-semibold text-amber-600 dark:text-amber-400 truncate flex items-center gap-1">
                                                    <ArrowRight className="h-2.5 w-2.5 shrink-0" />
                                                    {diff.imported || '—'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Invalid Rows Accordion */}
            {analysis.invalid_rows_count > 0 && (
                <div className="space-y-1.5 pt-1">
                    <button
                        type="button"
                        className="flex items-center gap-1 text-xs font-semibold text-destructive hover:underline"
                        onClick={() => setShowInvalidRows(!showInvalidRows)}
                    >
                        {showInvalidRows ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                        View {analysis.invalid_rows_count} Invalid / Skipped Row(s)
                    </button>
                    {showInvalidRows && (
                        <div className="rounded-lg border bg-destructive/5 p-2 space-y-1 max-h-28 overflow-y-auto text-[11px] font-mono">
                            {analysis.invalid_rows.map((inv, iIdx) => (
                                <p key={iIdx} className="text-destructive">
                                    • Row {inv.row_number}: {inv.reason}
                                </p>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Footer Action Buttons */}
            <div className="flex items-center justify-between border-t pt-3 mt-4">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onBack}
                    disabled={isSubmitting}
                >
                    Back to Settings
                </Button>

                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        size="sm"
                        className="bg-primary text-primary-foreground font-semibold px-4"
                        onClick={onConfirm}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            'Processing...'
                        ) : (
                            <>
                                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                                Confirm & Import (
                                {analysis.new_rows_count +
                                    Object.values(resolutions).length}{' '}
                                Records)
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
