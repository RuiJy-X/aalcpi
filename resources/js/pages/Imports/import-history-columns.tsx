import React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import {
    CheckCircle2,
    XCircle,
    Clock,
    RefreshCw,
    Building2,
    Database,
    Users,
    FileText,
    FileCheck,
    FileSpreadsheet,
    Trash2,
    User,
} from 'lucide-react';
import { format } from 'date-fns';

export type ImportJobItem = {
    id: number;
    type: string;
    status: 'queued' | 'running' | 'done' | 'failed';
    message: string | null;
    file_name: string;
    created_at: string;
    user_name: string;
    record_count: number;
    context?: Record<string, unknown>;
};

interface CreateImportHistoryColumnsProps {
    onViewSummary: (job: ImportJobItem) => void;
    onRunNow: (jobId: number) => void;
    onDelete: (jobId: number, fileName: string) => void;
    processingJobId: number | null;
    deletingId: number | null;
}

export function createImportHistoryColumns({
    onViewSummary,
    onRunNow,
    onDelete,
    processingJobId,
    deletingId,
}: CreateImportHistoryColumnsProps): ColumnDef<ImportJobItem>[] {
    const formatTypeName = (type: string) => {
        switch (type) {
            case 'bank_recon_internal':
            case 'internal':
                return 'Internal Ledger';
            case 'bank_recon_bank':
            case 'bank':
                return 'Bank Statement';
            case 'planters':
            case 'planters_excel':
                return 'Planter Masterlist';
            case 'productions':
            case 'productions_excel':
                return 'Production Data';
            case 'weekly':
            case 'weekly_pdf':
                return 'Weekly PDF Report';
            default:
                return type;
        }
    };

    const getTypeIcon = (type: string) => {
        if (type.includes('internal'))
            return <Building2 className="h-4 w-4 text-primary" />;
        if (type.includes('bank'))
            return <FileSpreadsheet className="h-4 w-4 text-emerald-500" />;
        if (type.includes('planter'))
            return <Users className="h-4 w-4 text-amber-500" />;
        if (type.includes('weekly'))
            return <FileText className="h-4 w-4 text-purple-500" />;
        return <Database className="h-4 w-4 text-blue-500" />;
    };

    const formatDate = (iso: string) => {
        if (!iso) return 'N/A';
        try {
            const d = new Date(iso);
            return format(d, 'MMM d, yyyy h:mm a');
        } catch {
            return iso;
        }
    };

    return [
        {
            accessorKey: 'file_name',
            header: 'File Name & Type',
            cell: ({ row }) => {
                const job = row.original;
                return (
                    <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-accent/60 p-2 shrink-0">
                            {getTypeIcon(job.type)}
                        </div>
                        <div className="min-w-0">
                            <p
                                className="max-w-xs truncate font-semibold text-foreground"
                                title={job.file_name}
                            >
                                {job.file_name}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                {formatTypeName(job.type)}
                            </p>
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: 'created_at',
            header: 'Imported At',
            cell: ({ row }) => (
                <span className="text-xs whitespace-nowrap text-muted-foreground font-medium">
                    {formatDate(row.original.created_at)}
                </span>
            ),
        },
        {
            accessorKey: 'user_name',
            header: 'Uploaded By',
            cell: ({ row }) => (
                <div className="flex items-center gap-1.5 text-xs font-medium whitespace-nowrap text-foreground">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{row.original.user_name}</span>
                </div>
            ),
        },
        {
            accessorKey: 'record_count',
            header: 'Records',
            cell: ({ row }) => (
                <span className="inline-flex items-center rounded-md bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground">
                    {row.original.record_count.toLocaleString()} rows
                </span>
            ),
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => {
                const job = row.original;
                return (
                    <div className="flex flex-col gap-1">
                        {job.status === 'done' && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Completed
                            </span>
                        )}
                        {job.status === 'failed' && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive">
                                <XCircle className="h-3.5 w-3.5" />
                                Failed
                            </span>
                        )}
                        {(job.status === 'running' || job.status === 'queued') && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                                <Clock className="h-3.5 w-3.5 animate-spin" />
                                Processing
                            </span>
                        )}
                        {job.message && (
                            <p
                                className="max-w-xs truncate text-[11px] text-muted-foreground"
                                title={job.message}
                            >
                                {job.message}
                            </p>
                        )}
                    </div>
                );
            },
        },
        {
            id: 'actions',
            header: () => <div className="text-right">Actions</div>,
            cell: ({ row }) => {
                const job = row.original;
                return (
                    <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                        {(job.status === 'queued' ||
                            job.status === 'running' ||
                            job.status === 'failed') && (
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={processingJobId === job.id}
                                onClick={() => onRunNow(job.id)}
                                className="gap-1.5 border-amber-300 bg-amber-50 font-bold text-amber-700 shadow-xs hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                            >
                                <RefreshCw
                                    className={`h-3.5 w-3.5 ${processingJobId === job.id ? 'animate-spin' : ''}`}
                                />
                                <span className="text-xs">
                                    {processingJobId === job.id
                                        ? 'Processing...'
                                        : 'Run Now'}
                                </span>
                            </Button>
                        )}

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onViewSummary(job)}
                            className="gap-1.5"
                        >
                            <FileCheck className="h-4 w-4 text-primary" />
                            <span className="text-xs font-medium">
                                Audit Report
                            </span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(job.id, job.file_name)}
                            disabled={deletingId === job.id}
                            className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                            {deletingId === job.id ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                                <Trash2 className="h-4 w-4" />
                            )}
                            <span className="text-xs font-medium">
                                Revert Import
                            </span>
                        </Button>
                    </div>
                );
            },
        },
    ];
}
