import React from 'react';
import { Link } from '@inertiajs/react';
import { DollarSign, Clock, Users, ArrowRight, CheckCircle2, HandCoins, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PayrollWorkflowData {
    total_count: number;
    draft_count: number;
    draft_amount: number;
    pending_count: number;
    pending_amount: number;
    paid_count: number;
    paid_amount: number;
    attendance_this_month: number;
    active_advance_balance: number;
}

interface PayrollWorkflowCardProps {
    data: PayrollWorkflowData;
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

export const PayrollWorkflowCard: React.FC<PayrollWorkflowCardProps> = ({
    data,
    className,
}) => {
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
                        <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                            <DollarSign className="size-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold tracking-tight text-slate-900">
                                Payroll & Workforce Processing
                            </h3>
                            <p className="text-xs text-slate-500">
                                Salary calculations, attendance feeds & cash advances
                            </p>
                        </div>
                    </div>

                    {data.pending_count > 0 ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs font-bold text-amber-800">
                            <AlertCircle className="size-3.5 text-amber-600" />
                            {data.pending_count} Pending Approval
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-bold text-emerald-800">
                            <CheckCircle2 className="size-3.5 text-emerald-600" />
                            Up to Date
                        </span>
                    )}
                </div>

                {/* 3-Stage Pipeline Grid */}
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {/* Stage 1: Ready for Processing (Draft) */}
                    <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3.5 flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                Ready / Draft
                            </span>
                            <span className="rounded-md bg-slate-200 px-1.5 py-0.5 text-[11px] font-bold text-slate-700">
                                {formatNum(data.draft_count)}
                            </span>
                        </div>
                        <div className="mt-2">
                            <span className="text-base font-black tracking-tight text-slate-900">
                                {formatCurrency(data.draft_amount)}
                            </span>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                                Uncomputed / in draft
                            </p>
                        </div>
                    </div>

                    {/* Stage 2: Action Required (Pending Approval) */}
                    <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-3.5 flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                                Action Required
                            </span>
                            <span className="rounded-md bg-amber-200 px-1.5 py-0.5 text-[11px] font-black text-amber-900">
                                {formatNum(data.pending_count)}
                            </span>
                        </div>
                        <div className="mt-2">
                            <span className="text-base font-black tracking-tight text-amber-950">
                                {formatCurrency(data.pending_amount)}
                            </span>
                            <p className="text-[11px] text-amber-700 mt-0.5">
                                Awaiting approval
                            </p>
                        </div>
                    </div>

                    {/* Stage 3: Paid History */}
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3.5 flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                                Paid / Disbursed
                            </span>
                            <span className="rounded-md bg-emerald-200 px-1.5 py-0.5 text-[11px] font-bold text-emerald-900">
                                {formatNum(data.paid_count)}
                            </span>
                        </div>
                        <div className="mt-2">
                            <span className="text-base font-black tracking-tight text-emerald-950">
                                {formatCurrency(data.paid_amount)}
                            </span>
                            <p className="text-[11px] text-emerald-700 mt-0.5">
                                Successfully paid
                            </p>
                        </div>
                    </div>
                </div>

                {/* Secondary Workforce & Advance Row */}
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {/* Active Cash Advance Balance */}
                    <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-xs">
                        <div className="flex items-center gap-2 text-slate-600">
                            <HandCoins className="size-4 text-emerald-600 shrink-0" />
                            <span>Active Cash Advances:</span>
                        </div>
                        <span className="font-bold text-slate-900">
                            {formatCurrency(data.active_advance_balance)}
                        </span>
                    </div>

                    {/* Monthly Timekeeping Attendance */}
                    <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-xs">
                        <div className="flex items-center gap-2 text-slate-600">
                            <Clock className="size-4 text-blue-600 shrink-0" />
                            <span>Attendance this Month:</span>
                        </div>
                        <span className="font-bold text-slate-900">
                            {formatNum(data.attendance_this_month)} logs
                        </span>
                    </div>
                </div>
            </div>

            {/* Footer Navigation */}
            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                    Auto deductions applied on active payroll batches
                </span>

                <Link
                    href="/Payroll"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 text-xs font-semibold shadow-xs transition-colors"
                >
                    <span>Process Payroll</span>
                    <ArrowRight className="size-3.5" />
                </Link>
            </div>
        </div>
    );
};
