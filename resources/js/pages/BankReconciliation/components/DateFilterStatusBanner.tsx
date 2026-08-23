import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Calendar, CheckCircle2, Clock, TriangleAlert } from 'lucide-react';
import type { FileAuditStatsType } from '../bank-recon-types';

interface DateFilterStatusBannerProps {
    fileAuditStats?: FileAuditStatsType;
    selectedWeek?: string;
    activeTab?: string;
    onOpenFilesModal: () => void;
}

export function DateFilterStatusBanner({
    fileAuditStats,
    selectedWeek = 'all',
    activeTab = 'all',
    onOpenFilesModal,
}: DateFilterStatusBannerProps) {
    if (!fileAuditStats) {
        return null;
    }

    const {
        period_label,
        missing_weeks,
        total_expected_files,
        total_imported_files,
        missing_files_count,
        is_complete,
    } = fileAuditStats;

    return (
        <span className="inline-flex flex-wrap items-center gap-1.5 align-middle font-normal">
            {/* Filter Period Badge */}
            {period_label && (
                <Badge
                    variant="outline"
                    className="h-6 gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-foreground shadow-2xs"
                >
                    <Calendar className="h-3 w-3" />
                    <span>{period_label}</span>
                </Badge>
            )}

            {/* File Completeness Status Pill (Clickable) */}
            <button
                type="button"
                onClick={onOpenFilesModal}
                title={
                    is_complete
                        ? 'All expected files loaded. Click to view file audit.'
                        : `Missing ${missing_files_count} file(s). Click to view details or import missing files.`
                }
                className={`inline-flex h-6 cursor-pointer items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold shadow-2xs transition-colors ${
                    is_complete
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                }`}
            >
                {is_complete ? (
                    <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                ) : (
                    <TriangleAlert className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                )}
                <span>
                    {total_imported_files}/{total_expected_files} Files
                </span>
                {missing_weeks && missing_weeks.length > 0 && (
                    <span className="text-[11px] font-normal text-amber-700 dark:text-amber-400">
                        (Missing Wk {missing_weeks.join(', ')})
                    </span>
                )}
            </button>

            {/* Active Sub-filter Badges */}
            {selectedWeek !== 'all' && (
                <Badge
                    variant="outline"
                    className="h-6 gap-1 rounded-full border-sky-300 bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-800 shadow-2xs dark:bg-sky-950/60 dark:text-sky-300"
                >
                    <Clock className="h-3 w-3 text-sky-600 dark:text-sky-400" />
                    <span>Week {selectedWeek}</span>
                </Badge>
            )}
        </span>
    );
}
