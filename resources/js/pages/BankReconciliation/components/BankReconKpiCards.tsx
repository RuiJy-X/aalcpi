import React from 'react';
import {
    CircleCheck,
    Clock,
    Copy,
    FileText,
    Layers,
    TriangleAlert,
    Wallet,
    Landmark,
    TrendingDown,
    TrendingUp,
    Scale,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface BankReconKpiCardsProps {
    summaryStats?: {
        total_count: number;
        internal_total: number;
        bank_total: number;
    };
    kpiStats?: {
        matched: number;
        outstanding: number;
        mismatched: number;
        unrecorded: number;
        duplicates: number;
    };
    selectedStatus: string;
    showDuplicates: boolean;
    onSelectStatus: (status: string) => void;
    onToggleDuplicates: () => void;
}

const formatCurrency = (val: number) =>
    '₱' +
    Number(val || 0).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

export function BankReconKpiCards({
    summaryStats = { total_count: 0, internal_total: 0, bank_total: 0 },
    kpiStats = {
        matched: 0,
        outstanding: 0,
        mismatched: 0,
        unrecorded: 0,
        duplicates: 0,
    },
    selectedStatus,
    showDuplicates,
    onSelectStatus,
    onToggleDuplicates,
}: BankReconKpiCardsProps) {
    const variance = summaryStats.internal_total - summaryStats.bank_total;
    const isBalanced = Math.abs(variance) < 0.01;

    const isAllActive = selectedStatus === 'all' && !showDuplicates;
    const isMatchedActive = selectedStatus === 'Matched' && !showDuplicates;
    const isOutstandingActive =
        selectedStatus === 'Outstanding' && !showDuplicates;
    const isMismatchActive =
        selectedStatus === 'Amount Mismatch' && !showDuplicates;
    const isUnrecordedActive =
        selectedStatus === 'Unrecorded Bank Entry' && !showDuplicates;
    const isDuplicatesActive = showDuplicates;

    return (
        <div className="space-y-4">
            {/* Top Financial Ledger & Clearance Balance Card */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {/* 1. Internal Disbursements Total */}
                <div className="flex items-center justify-between rounded-xl border bg-card p-4 shadow-2xs">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Wallet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Internal Disbursements
                            </span>
                        </div>
                        <p className="font-mono text-xl font-bold text-foreground sm:text-2xl">
                            {formatCurrency(summaryStats.internal_total)}
                        </p>
                    </div>
                    <div className="rounded-lg bg-emerald-500/10 p-2.5 text-emerald-600 dark:text-emerald-400">
                        <TrendingUp className="h-5 w-5" />
                    </div>
                </div>

                {/* 2. Bank Statement Debits Total */}
                <div className="flex items-center justify-between rounded-xl border bg-card p-4 shadow-2xs">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Landmark className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Bank Statement Debits
                            </span>
                        </div>
                        <p className="font-mono text-xl font-bold text-foreground sm:text-2xl">
                            {formatCurrency(summaryStats.bank_total)}
                        </p>
                    </div>
                    <div className="rounded-lg bg-sky-500/10 p-2.5 text-sky-600 dark:text-sky-400">
                        <TrendingDown className="h-5 w-5" />
                    </div>
                </div>

                {/* 3. Variance / Difference */}
                <div
                    className={`flex items-center justify-between rounded-xl border p-4 shadow-2xs transition-colors ${
                        isBalanced
                            ? 'border-emerald-500/30 bg-emerald-500/5'
                            : 'border-amber-500/30 bg-amber-500/5'
                    }`}
                >
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Scale
                                className={`h-4 w-4 ${
                                    isBalanced
                                        ? 'text-emerald-600 dark:text-emerald-400'
                                        : 'text-amber-600 dark:text-amber-400'
                                }`}
                            />
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Reconciliation Variance
                            </span>
                        </div>
                        <p
                            className={`font-mono text-xl font-bold sm:text-2xl ${
                                isBalanced
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-amber-600 dark:text-amber-400'
                            }`}
                        >
                            {formatCurrency(variance)}
                        </p>
                    </div>
                    <Badge
                        variant="outline"
                        className={`text-[11px] font-bold ${
                            isBalanced
                                ? 'border-emerald-500/30 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'border-amber-500/30 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                    >
                        {isBalanced ? 'Balanced' : 'Net Difference'}
                    </Badge>
                </div>
            </div>

            {/* Interactive Status & Metric Filter Cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {/* 1. All Records */}
                <button
                    type="button"
                    onClick={() => onSelectStatus('all')}
                    className={`group flex flex-col justify-between rounded-xl border p-3.5 text-left transition-all hover:shadow-sm ${
                        isAllActive
                            ? 'border-primary bg-primary/5 shadow-xs ring-2 ring-primary/30'
                            : 'border-border bg-card hover:border-border/80 hover:bg-muted/30'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                            All Records
                        </span>
                        <div
                            className={`rounded-lg p-1.5 transition-colors ${
                                isAllActive
                                    ? 'bg-primary/20 text-primary'
                                    : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                            }`}
                        >
                            <FileText className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-3 flex items-baseline justify-between">
                        <span className="text-2xl font-bold text-foreground">
                            {summaryStats.total_count.toLocaleString()}
                        </span>
                        {isAllActive && (
                            <span className="text-[10px] font-bold text-primary">
                                Active
                            </span>
                        )}
                    </div>
                </button>

                {/* 2. Matched */}
                <button
                    type="button"
                    onClick={() => onSelectStatus('Matched')}
                    className={`group flex flex-col justify-between rounded-xl border p-3.5 text-left transition-all hover:shadow-sm ${
                        isMatchedActive
                            ? 'border-emerald-600 bg-emerald-500/10 shadow-xs ring-2 ring-emerald-600/30 dark:border-emerald-500'
                            : 'border-border bg-card hover:border-emerald-500/40 hover:bg-emerald-500/5'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                            Matched
                        </span>
                        <div
                            className={`rounded-lg p-1.5 transition-colors ${
                                isMatchedActive
                                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                    : 'bg-muted text-muted-foreground group-hover:bg-emerald-500/10 group-hover:text-emerald-600'
                            }`}
                        >
                            <CircleCheck className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-3 flex items-baseline justify-between">
                        <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                            {kpiStats.matched.toLocaleString()}
                        </span>
                        {isMatchedActive && (
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                Active
                            </span>
                        )}
                    </div>
                </button>

                {/* 3. Outstanding */}
                <button
                    type="button"
                    onClick={() => onSelectStatus('Outstanding')}
                    className={`group flex flex-col justify-between rounded-xl border p-3.5 text-left transition-all hover:shadow-sm ${
                        isOutstandingActive
                            ? 'border-sky-600 bg-sky-500/10 shadow-xs ring-2 ring-sky-600/30 dark:border-sky-500'
                            : 'border-border bg-card hover:border-sky-500/40 hover:bg-sky-500/5'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                            Outstanding
                        </span>
                        <div
                            className={`rounded-lg p-1.5 transition-colors ${
                                isOutstandingActive
                                    ? 'bg-sky-500/20 text-sky-600 dark:text-sky-400'
                                    : 'bg-muted text-muted-foreground group-hover:bg-sky-500/10 group-hover:text-sky-600'
                            }`}
                        >
                            <Clock className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-3 flex items-baseline justify-between">
                        <span className="text-2xl font-bold text-sky-600 dark:text-sky-400">
                            {kpiStats.outstanding.toLocaleString()}
                        </span>
                        {isOutstandingActive && (
                            <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400">
                                Active
                            </span>
                        )}
                    </div>
                </button>

                {/* 4. Amount Mismatch */}
                <button
                    type="button"
                    onClick={() => onSelectStatus('Amount Mismatch')}
                    className={`group flex flex-col justify-between rounded-xl border p-3.5 text-left transition-all hover:shadow-sm ${
                        isMismatchActive
                            ? 'border-rose-600 bg-rose-500/10 shadow-xs ring-2 ring-rose-600/30 dark:border-rose-500'
                            : 'border-border bg-card hover:border-rose-500/40 hover:bg-rose-500/5'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                            Mismatch
                        </span>
                        <div
                            className={`rounded-lg p-1.5 transition-colors ${
                                isMismatchActive
                                    ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                                    : 'bg-muted text-muted-foreground group-hover:bg-rose-500/10 group-hover:text-rose-600'
                            }`}
                        >
                            <TriangleAlert className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-3 flex items-baseline justify-between">
                        <span className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                            {kpiStats.mismatched.toLocaleString()}
                        </span>
                        {isMismatchActive && (
                            <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">
                                Active
                            </span>
                        )}
                    </div>
                </button>

                {/* 5. Unrecorded Bank Entry */}
                <button
                    type="button"
                    onClick={() => onSelectStatus('Unrecorded Bank Entry')}
                    className={`group flex flex-col justify-between rounded-xl border p-3.5 text-left transition-all hover:shadow-sm ${
                        isUnrecordedActive
                            ? 'border-purple-600 bg-purple-500/10 shadow-xs ring-2 ring-purple-600/30 dark:border-purple-500'
                            : 'border-border bg-card hover:border-purple-500/40 hover:bg-purple-500/5'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                            Unrecorded
                        </span>
                        <div
                            className={`rounded-lg p-1.5 transition-colors ${
                                isUnrecordedActive
                                    ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400'
                                    : 'bg-muted text-muted-foreground group-hover:bg-purple-500/10 group-hover:text-purple-600'
                            }`}
                        >
                            <Layers className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-3 flex items-baseline justify-between">
                        <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                            {kpiStats.unrecorded.toLocaleString()}
                        </span>
                        {isUnrecordedActive && (
                            <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400">
                                Active
                            </span>
                        )}
                    </div>
                </button>

                {/* 6. Duplicate Checks */}
                <button
                    type="button"
                    onClick={onToggleDuplicates}
                    className={`group flex flex-col justify-between rounded-xl border p-3.5 text-left transition-all hover:shadow-sm ${
                        isDuplicatesActive
                            ? 'border-orange-600 bg-orange-500/10 shadow-xs ring-2 ring-orange-600/30 dark:border-orange-500'
                            : 'border-border bg-card hover:border-orange-500/40 hover:bg-orange-500/5'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                            Duplicates
                        </span>
                        <div
                            className={`rounded-lg p-1.5 transition-colors ${
                                isDuplicatesActive
                                    ? 'bg-orange-500/20 text-orange-600 dark:text-orange-400'
                                    : 'bg-muted text-muted-foreground group-hover:bg-orange-500/10 group-hover:text-orange-600'
                            }`}
                        >
                            <Copy className="h-4 w-4" />
                        </div>
                    </div>
                    <div className="mt-3 flex items-baseline justify-between">
                        <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                            {kpiStats.duplicates.toLocaleString()}
                        </span>
                        {isDuplicatesActive && (
                            <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400">
                                Active
                            </span>
                        )}
                    </div>
                </button>
            </div>
        </div>
    );
}
