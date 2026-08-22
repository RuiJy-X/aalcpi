import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Calendar,
    CheckCircle2,
    Clock,
    FileCheck2,
    FileSpreadsheet,
    FileText,
    FolderSearch,
    Layers,
    TriangleAlert,
    X,
} from 'lucide-react';
import type { FileAuditStatsType } from '../bank-recon-types';

interface DateFilterStatusBannerProps {
    fileAuditStats?: FileAuditStatsType;
    selectedWeek?: string;
    selectedStatus?: string;
    showDuplicates?: boolean;
    onOpenFilesModal: () => void;
}

export function DateFilterStatusBanner({
    fileAuditStats,
    selectedWeek = 'all',
    selectedStatus = 'all',
    showDuplicates = false,
    onOpenFilesModal,
}: DateFilterStatusBannerProps) {
    if (!fileAuditStats) {
        return null;
    }

    const {
        has_date_filter,
        period_label,
        month_label,
        bank_file,
        weekly_ledgers,
        expected_weeks,
        missing_weeks,
        imported_weeks_count,
        total_expected_files,
        total_imported_files,
        is_complete,
    } = fileAuditStats;

    const isBankImported = bank_file.status === 'imported';

    return (
        <div className="mx-2 mb-3 rounded-xl border bg-card/60 p-3 shadow-xs backdrop-blur-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                {/* Left Side: Filtered Date & Active Filters */}
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Filter Period:</span>
                        <span className="font-bold text-foreground underline decoration-primary/50 underline-offset-2">
                            {period_label}
                        </span>
                    </div>

                    {selectedWeek !== 'all' && (
                        <Badge variant="outline" className="gap-1 text-xs font-medium border-sky-300 bg-sky-50 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                            <Clock className="h-3 w-3" />
                            Week {selectedWeek}
                        </Badge>
                    )}

                    {selectedStatus !== 'all' && (
                        <Badge variant="outline" className="text-xs font-medium border-slate-300 bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                            Status: {selectedStatus}
                        </Badge>
                    )}

                    {showDuplicates && (
                        <Badge variant="outline" className="text-xs font-medium border-orange-300 bg-orange-50 text-orange-800 dark:bg-orange-950 dark:text-orange-300">
                            Duplicates Only
                        </Badge>
                    )}
                </div>

                {/* Right Side: File Status Badges & Trigger */}
                <div className="flex flex-wrap items-center gap-2.5">
                    {/* Bank Statement Status Chip */}
                    <div
                        onClick={onOpenFilesModal}
                        className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                            isBankImported
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300'
                                : 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300'
                        }`}
                    >
                        {isBankImported ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                            <TriangleAlert className="h-3.5 w-3.5 text-amber-600" />
                        )}
                        <span className="font-semibold">Bank Statement:</span>
                        <span className="truncate max-w-[140px] sm:max-w-[180px]">
                            {isBankImported ? bank_file.file_name || 'Loaded' : 'Missing'}
                        </span>
                    </div>

                    {/* Weekly Summary Ledgers Status Chip */}
                    <div
                        onClick={onOpenFilesModal}
                        className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                            missing_weeks.length === 0
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300'
                                : 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300'
                        }`}
                    >
                        {missing_weeks.length === 0 ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                            <TriangleAlert className="h-3.5 w-3.5 text-amber-600" />
                        )}
                        <span className="font-semibold">Weekly Ledgers:</span>
                        <span>
                            {imported_weeks_count}/{expected_weeks.length} Weeks
                            {missing_weeks.length > 0 && ` (Missing: Wk ${missing_weeks.join(', ')})`}
                        </span>
                    </div>

                    {/* View Files Modal Button */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onOpenFilesModal}
                        className="gap-1.5 h-8 text-xs font-semibold shadow-xs hover:bg-primary/5 hover:text-primary"
                    >
                        <FolderSearch className="h-3.5 w-3.5 text-primary" />
                        <span>Files & Completeness</span>
                        <Badge
                            variant="secondary"
                            className={`ml-1 px-1.5 py-0 text-[10px] font-bold ${
                                is_complete
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            }`}
                        >
                            {total_imported_files}/{total_expected_files}
                        </Badge>
                    </Button>
                </div>
            </div>
        </div>
    );
}
