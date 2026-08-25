import React from 'react';
import { Link } from '@inertiajs/react';
import { Clock3, ArrowRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface RecentActivityItem {
    type: string;
    label: string;
    status: string;
    message?: string | null;
    at: string | null;
    href: string | null;
}

interface LiveIngestionStreamProps {
    activity: RecentActivityItem[];
    className?: string;
}

function formatRelative(iso: string | null): string {
    if (!iso) return '—';
    try {
        const date = new Date(iso);
        if (Number.isNaN(date.getTime())) return '—';
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return '—';
    }
}

export const LiveIngestionStream: React.FC<LiveIngestionStreamProps> = ({
    activity = [],
    className,
}) => {
    return (
        <div
            className={cn(
                'flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-5 shadow-2xs transition-all hover:border-slate-300 min-w-0 w-full overflow-hidden',
                className,
            )}
        >
            <div className="min-w-0">
                {/* Header */}
                <div className="flex items-center justify-between gap-2.5 border-b border-slate-100 pb-3 mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white">
                            <Clock3 className="size-4" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-sm font-bold tracking-tight text-slate-900 truncate">
                                Live Ingestion Stream
                            </h3>
                            <p className="text-[11px] text-slate-400 truncate">
                                Background file imports & status
                            </p>
                        </div>
                    </div>

                    <span className="flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700 shrink-0">
                        <span className="flex size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Active
                    </span>
                </div>

                {/* Activity List */}
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 min-w-0">
                    {activity.length === 0 && (
                        <div className="py-6 text-center text-xs text-slate-400">
                            No recent file import jobs recorded.
                        </div>
                    )}

                    {activity.slice(0, 6).map((item, idx) => {
                        const isDone = item.status === 'done';
                        const isFailed = item.status === 'failed';
                        const isRunning = item.status === 'running' || item.status === 'queued';

                        return (
                            <div
                                key={`${item.type}-${idx}-${item.at}`}
                                className="rounded-lg border border-slate-100 bg-slate-50/50 p-2.5 text-xs transition-colors hover:bg-slate-50 min-w-0"
                            >
                                <div className="flex items-center justify-between gap-2 min-w-0">
                                    <span className="font-bold text-slate-900 truncate min-w-0 text-xs">
                                        {item.label}
                                    </span>

                                    <span
                                        className={cn(
                                            'shrink-0 inline-flex items-center gap-1 rounded-full px-1.5 py-0.2 text-[9.5px] font-extrabold uppercase tracking-wide',
                                            isDone && 'bg-emerald-100 text-emerald-800 border border-emerald-200',
                                            isFailed && 'bg-rose-100 text-rose-800 border border-rose-200',
                                            isRunning && 'bg-blue-100 text-blue-800 border border-blue-200',
                                        )}
                                    >
                                        {isDone && <CheckCircle2 className="size-2.5 text-emerald-600" />}
                                        {isFailed && <AlertCircle className="size-2.5 text-rose-600" />}
                                        {isRunning && <Loader2 className="size-2.5 text-blue-600 animate-spin" />}
                                        {item.status}
                                    </span>
                                </div>

                                <div className="mt-1 flex items-center justify-between text-[10.5px] text-slate-400">
                                    <span>{item.type}</span>
                                    <span>{formatRelative(item.at)}</span>
                                </div>

                                {item.message && (
                                    <p
                                        className={cn(
                                            'mt-1 text-[10.5px] line-clamp-1 rounded p-1',
                                            isFailed
                                                ? 'bg-rose-50 text-rose-700 font-medium'
                                                : 'text-slate-500 italic',
                                        )}
                                    >
                                        {item.message}
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Footer Navigation */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">
                    Automatic background queue
                </span>

                <Link
                    href="/Imports/history"
                    className="inline-flex items-center gap-1 font-semibold text-slate-700 hover:text-slate-900 transition-colors"
                >
                    <span>Import History</span>
                    <ArrowRight className="size-3" />
                </Link>
            </div>
        </div>
    );
};
