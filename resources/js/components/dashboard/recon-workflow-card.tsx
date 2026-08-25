import React from 'react';
import { Link } from '@inertiajs/react';
import { Banknote, AlertTriangle, CheckCircle2, ArrowRight, FileQuestion } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BankReconWorkflowData {
    total: number;
    matched_count: number;
    match_rate: number;
    outstanding_count: number;
    outstanding_amount: number;
    unrecorded_count: number;
    unrecorded_amount: number;
    mismatch_count: number;
}

interface ReconWorkflowCardProps {
    data: BankReconWorkflowData;
    className?: string;
}

function formatCurrency(val: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
    }).format(Number.isFinite(val) ? val : 0);
}

function formatNum(val: number): string {
    return new Intl.NumberFormat('en-US').format(Number.isFinite(val) ? val : 0);
}

export const ReconWorkflowCard: React.FC<ReconWorkflowCardProps> = ({
    data,
    className,
}) => {
    const isBalanced = data.outstanding_count === 0 && data.unrecorded_count === 0 && data.mismatch_count === 0;

    return (
        <div
            className={cn(
                'flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-xs transition-all hover:border-slate-300',
                className,
            )}
        >
            <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            <Banknote className="size-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold tracking-tight text-slate-900">
                                Bank Reconciliation & Treasury
                            </h3>
                            <p className="text-xs text-slate-500">
                                Internal disbursements vs bank statements pairing
                            </p>
                        </div>
                    </div>

                    <span
                        className={cn(
                            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold',
                            isBalanced
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200',
                        )}
                    >
                        {isBalanced ? (
                            <>
                                <CheckCircle2 className="size-3.5 text-emerald-600" />
                                Balanced
                            </>
                        ) : (
                            <>
                                <AlertTriangle className="size-3.5 text-amber-600" />
                                Action Needed
                            </>
                        )}
                    </span>
                </div>

                {/* Match Rate Progress */}
                <div className="mt-4">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-semibold text-slate-700">Reconciliation Match Rate</span>
                        <span className="font-black text-slate-900 text-sm">{data.match_rate}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
                        <div
                            className={cn(
                                'h-full rounded-full transition-all duration-500',
                                data.match_rate >= 90 ? 'bg-emerald-600' : data.match_rate >= 70 ? 'bg-blue-600' : 'bg-amber-500',
                            )}
                            style={{ width: `${Math.min(100, Math.max(0, data.match_rate))}%` }}
                        />
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400">
                        {formatNum(data.matched_count)} of {formatNum(data.total)} records matched
                    </p>
                </div>

                {/* Outstanding & Discrepancies Grid */}
                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {/* Tile 1: Outstanding Checks */}
                    <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3.5 flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                Outstanding Checks
                            </span>
                            <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[11px] font-black text-amber-800">
                                {formatNum(data.outstanding_count)}
                            </span>
                        </div>
                        <div className="mt-2">
                            <span className="text-lg font-black tracking-tight text-slate-900">
                                {formatCurrency(data.outstanding_amount)}
                            </span>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                                Uncashed internal check float
                            </p>
                        </div>
                    </div>

                    {/* Tile 2: Unrecorded Bank Entries */}
                    <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3.5 flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                Unrecorded Bank Entries
                            </span>
                            <span className="rounded-md bg-blue-100 px-1.5 py-0.5 text-[11px] font-black text-blue-800">
                                {formatNum(data.unrecorded_count)}
                            </span>
                        </div>
                        <div className="mt-2">
                            <span className="text-lg font-black tracking-tight text-slate-900">
                                {formatCurrency(data.unrecorded_amount)}
                            </span>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                                Bank statement debits missing from books
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Navigation */}
            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                    {data.mismatch_count > 0 ? (
                        <span className="text-rose-600 font-semibold flex items-center gap-1">
                            <FileQuestion className="size-3.5" />
                            {data.mismatch_count} check amount mismatch(es)
                        </span>
                    ) : (
                        'Automatic exact & fuzzy check matching enabled'
                    )}
                </span>

                <Link
                    href="/BankReconciliation"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 text-xs font-semibold shadow-xs transition-colors"
                >
                    <span>Open Reconciliation</span>
                    <ArrowRight className="size-3.5" />
                </Link>
            </div>
        </div>
    );
};
