import { usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import type { SharedData } from '@/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

const POLL_INTERVAL_MS = 4000;
const STORAGE_KEY = 'import_job_id';



type ImportJobStatus = {
    id: number;
    type: string;
    status: 'queued' | 'running' | 'done' | 'failed';
    message?: string | null;
};

const STATUS_LABELS: Record<ImportJobStatus['status'], string> = {
    queued: 'Queued',
    running: 'Running',
    done: 'Done',
    failed: 'Failed',
};

const STATUS_VARIANTS: Record<ImportJobStatus['status'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
    queued: 'secondary',
    running: 'outline',
    done: 'default',
    failed: 'destructive',
};

const TYPE_LABELS: Record<string, string> = {
    weekly_pdf: 'Weekly PDF import',
    productions_excel: 'Productions import',
    planters_excel: 'Planters import',
    attendance_excel: 'Attendance import',
};

const parseJobId = (value: unknown): number | null => {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }

    if (typeof value === 'string') {
        const parsed = Number.parseInt(value, 10);
        return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
};

export function ImportJobStatusBanner() {
    const { flash } = usePage<SharedData>().props;
    const [jobId, setJobId] = useState<number | null>(null);
    const [status, setStatus] = useState<ImportJobStatus | null>(null);
    const [error, setError] = useState<string | null>(null);

    const flashJobId = useMemo(() => parseJobId(flash?.import_job_id), [flash?.import_job_id]);

    useEffect(() => {
        if (flashJobId) {
            setJobId(flashJobId);
            if (typeof window !== 'undefined') {
                window.localStorage.setItem(STORAGE_KEY, String(flashJobId));
            }
            return;
        }

        if (typeof window === 'undefined') {
            return;
        }

        const storedId = parseJobId(window.localStorage.getItem(STORAGE_KEY));
        if (storedId) {
            setJobId(storedId);
        }
    }, [flashJobId]);

    useEffect(() => {
        if (!jobId) {
            setStatus(null);
            setError(null);
            return;
        }

        let isMounted = true;
        let intervalId: number | undefined;

        const fetchStatus = async () => {
            try {
                const response = await fetch(`/Imports/status/${jobId}`, {
                    headers: {
                        Accept: 'application/json',
                    },
                });

                if (response.status === 404 || response.status === 403) {
                    if (typeof window !== 'undefined') {
                        window.localStorage.removeItem(STORAGE_KEY);
                    }
                    if (isMounted) {
                        setJobId(null);
                        setStatus(null);
                        setError(null);
                    }
                    return;
                }

                if (!response.ok) {
                    throw new Error(`Unable to load import status (${response.status}).`);
                }

                const payload = (await response.json()) as ImportJobStatus;

                if (!isMounted) {
                    return;
                }

                setStatus(payload);
                setError(null);

                if (payload.status === 'done' || payload.status === 'failed') {
                    if (intervalId) {
                        window.clearInterval(intervalId);
                    }
                    if (typeof window !== 'undefined') {
                        window.localStorage.removeItem(STORAGE_KEY);
                    }
                }
            } catch (err) {
                if (!isMounted) {
                    return;
                }

                setError(err instanceof Error ? err.message : 'Unable to load import status.');
            }
        };

        fetchStatus();
        intervalId = window.setInterval(fetchStatus, POLL_INTERVAL_MS);

        return () => {
            isMounted = false;
            if (intervalId) {
                window.clearInterval(intervalId);
            }
        };
    }, [jobId]);

    if (!jobId) {
        return null;
    }

    const heading = status?.type ? TYPE_LABELS[status.type] ?? 'Import status' : 'Import status';
    const badgeLabel = status ? STATUS_LABELS[status.status] : 'Checking';
    const badgeVariant = status ? STATUS_VARIANTS[status.status] : 'outline';

    return (
        <Alert className="mb-4">
            <AlertTitle>{heading}</AlertTitle>
            <AlertDescription>
                <div className="flex items-center gap-2">
                    <Badge variant={badgeVariant}>{badgeLabel}</Badge>
                    <span>
                        {error
                            ? error
                            : status?.message
                                ? status.message
                                : status?.status === 'done'
                                    ? 'Import finished successfully.'
                                    : status?.status === 'failed'
                                        ? 'Import failed. Please review the details.'
                                        : 'Import is processing in the background.'}
                    </span>
                </div>
            </AlertDescription>
        </Alert>
    );
}
