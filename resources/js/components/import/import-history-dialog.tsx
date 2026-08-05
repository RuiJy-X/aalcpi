import React, { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { History, Trash2, RefreshCw, FileText, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

type ImportJobHistoryItem = {
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

const getCsrfToken = (): string => {
    const token = document
        .querySelector('meta[name="csrf-token"]')
        ?.getAttribute('content');
    return token ?? '';
};

export function ImportHistoryDialog({ type = 'bank_recon' }: { type?: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [jobs, setJobs] = useState<ImportJobHistoryItem[]>([]);
    const [error, setError] = useState<string | null>(null);

    const fetchHistory = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`/Imports/history?type=${encodeURIComponent(type)}`, {
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const data = await response.json();
            setJobs(data.jobs ?? []);
        } catch (err) {
            const error = err as Error;
            setError(`Failed to load import history: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchHistory();
        }
    }, [isOpen]);

    const handleDeleteImport = async (jobId: number) => {
        if (!confirm('Are you sure you want to delete this import? All records associated with this spreadsheet will be removed.')) {
            return;
        }

        setDeletingId(jobId);
        setError(null);

        try {
            const response = await fetch(`/Imports/history/${jobId}`, {
                method: 'DELETE',
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            // Refresh local list and reload parent page data
            setJobs((prev) => prev.filter((j) => j.id !== jobId));
            router.reload({ preserveScroll: true });
        } catch (err) {
            const error = err as Error;
            setError(`Failed to delete import batch: ${error.message}`);
        } finally {
            setDeletingId(null);
        }
    };

    const formatTypeName = (type: string) => {
        if (type.includes('internal')) return 'Internal Ledger';
        if (type.includes('bank')) return 'Bank Statement';
        return type;
    };

    const formatDate = (iso: string) => {
        if (!iso) return 'N/A';
        const d = new Date(iso);
        return d.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <History className="h-4 w-4" />
                    Import History
                </Button>
            </DialogTrigger>

            <DialogContent className="bg-card sm:max-w-2xl max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <History className="h-5 w-5 text-primary" />
                        Import History Log
                    </DialogTitle>
                    <DialogDescription>
                        View past file imports and delete specific import batches if needed.
                    </DialogDescription>
                </DialogHeader>

                {error && (
                    <div className="rounded-md bg-destructive/10 p-3 text-xs font-medium text-destructive">
                        {error}
                    </div>
                )}

                <div className="flex-1 overflow-y-auto space-y-3 pr-1 py-2">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-10 text-muted-foreground gap-2">
                            <RefreshCw className="h-5 w-5 animate-spin" />
                            <span>Loading import history...</span>
                        </div>
                    ) : jobs.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground space-y-1">
                            <FileText className="h-8 w-8 mx-auto text-muted-foreground/50" />
                            <p className="text-sm font-medium">No import records found</p>
                            <p className="text-xs">Your spreadsheet uploads will appear here.</p>
                        </div>
                    ) : (
                        jobs.map((job) => (
                            <div
                                key={job.id}
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border bg-background hover:bg-muted/30 transition-colors"
                            >
                                <div className="space-y-1 flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-semibold text-sm truncate max-w-[240px]">
                                            {job.file_name}
                                        </span>
                                        <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-secondary text-secondary-foreground">
                                            {formatTypeName(job.type)}
                                        </span>
                                        {job.status === 'done' && (
                                            <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                                                <CheckCircle2 className="h-3.5 w-3.5" />
                                                Done
                                            </span>
                                        )}
                                        {job.status === 'failed' && (
                                            <span className="flex items-center gap-1 text-[11px] font-medium text-destructive">
                                                <XCircle className="h-3.5 w-3.5" />
                                                Failed
                                            </span>
                                        )}
                                        {(job.status === 'running' || job.status === 'queued') && (
                                            <span className="flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                                                <Clock className="h-3.5 w-3.5 animate-spin" />
                                                Processing
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                        <span>Uploaded: {formatDate(job.created_at)}</span>
                                        <span>•</span>
                                        <span>{job.record_count} active record(s)</span>
                                        <span>•</span>
                                        <span>By: {job.user_name}</span>
                                    </div>

                                    {job.message && (
                                        <p className="text-xs text-muted-foreground italic truncate">
                                            {job.message}
                                        </p>
                                    )}
                                </div>

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteImport(job.id)}
                                    disabled={deletingId === job.id}
                                    className="text-destructive hover:bg-destructive/10 hover:text-destructive self-end sm:self-center gap-1.5"
                                >
                                    {deletingId === job.id ? (
                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Trash2 className="h-4 w-4" />
                                    )}
                                    <span className="text-xs font-medium">Delete Import</span>
                                </Button>
                            </div>
                        ))
                    )}
                </div>

                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Close</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
