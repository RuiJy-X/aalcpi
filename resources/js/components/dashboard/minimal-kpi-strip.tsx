import React from 'react';
import { Link } from '@inertiajs/react';
import { Scale, Droplets, CheckCircle2, Banknote } from 'lucide-react';
import { ProductionWorkflowData } from './production-workflow-card';
import { BankReconWorkflowData } from './recon-workflow-card';
import { PayrollWorkflowData } from './payroll-workflow-card';
import { cn } from '@/lib/utils';
import { useCan } from '@/hooks/use-can';

interface MinimalKpiStripProps {
    production: ProductionWorkflowData;
    recon: BankReconWorkflowData;
    payroll: PayrollWorkflowData;
    className?: string;
}

function formatNum(val: number, decimals = 0): string {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(Number.isFinite(val) ? val : 0);
}

function formatCurrency(val: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number.isFinite(val) ? val : 0);
}

export const MinimalKpiStrip: React.FC<MinimalKpiStripProps> = ({
    production,
    recon,
    payroll,
    className,
}) => {
    const { can } = useCan();
    const canViewProd = can('productions.view') || can('planters.view');
    const canViewRecon = can('bank_reconciliation.view');
    const canViewPayroll = can('payroll.view') || can('attendance.view');

    return (
        <div className={cn('grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4 w-full min-w-0', className)}>
            {/* Card 1: Cane Weight Volume */}
            {canViewProd && (
                <Link
                    href="/Productions"
                    className="group flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs transition-all hover:border-slate-300 hover:shadow-xs min-w-0 overflow-hidden"
                >
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">
                            Net Cane Weight
                        </span>
                        <Scale className="size-4 text-slate-400 group-hover:text-slate-700 transition-colors shrink-0" />
                    </div>

                    <div className="my-2 min-w-0">
                        <div className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 truncate tabular-nums">
                            {formatNum(production.net_cw, 2)}{' '}
                            <span className="text-xs font-normal text-slate-500">Tons</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 min-w-0">
                        <span className="truncate mr-1">Gross: {formatNum(production.gross_cw, 0)} t</span>
                        <span className="shrink-0">{formatNum(production.trucks, 0)} Trucks</span>
                    </div>
                </Link>
            )}

            {/* Card 2: Sugar & Molasses Yield */}
            {canViewProd && (
                <Link
                    href="/Productions"
                    className="group flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs transition-all hover:border-slate-300 hover:shadow-xs min-w-0 overflow-hidden"
                >
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">
                            Sugar Production
                        </span>
                        <Droplets className="size-4 text-slate-400 group-hover:text-slate-700 transition-colors shrink-0" />
                    </div>

                    <div className="my-2 min-w-0">
                        <div className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 truncate tabular-nums">
                            {formatNum(production.actual_lkg, 2)}{' '}
                            <span className="text-xs font-normal text-slate-500">LKG</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 min-w-0">
                        <span className="truncate mr-1">Planter: {formatNum(production.pshr_net_lkg, 0)} LKG</span>
                        <span className="shrink-0">{formatNum(production.actual_mol, 0)} Mol</span>
                    </div>
                </Link>
            )}

            {/* Card 3: Productions Status Pipeline */}
            {canViewProd && (
                <Link
                    href="/Productions"
                    className="group flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs transition-all hover:border-slate-300 hover:shadow-xs min-w-0 overflow-hidden"
                >
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">
                            Production Rows
                        </span>
                        <CheckCircle2 className="size-4 text-slate-400 group-hover:text-emerald-600 transition-colors shrink-0" />
                    </div>

                    <div className="my-2 min-w-0">
                        <div className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 truncate tabular-nums">
                            {formatNum(production.total_rows, 0)}{' '}
                            <span className="text-xs font-normal text-slate-500">Rows</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 min-w-0">
                        <span className="text-emerald-700 font-medium truncate mr-1">{production.percent_complete}% Done</span>
                        <span className={cn('shrink-0 font-medium', production.draft_count > 0 ? 'text-amber-700' : 'text-slate-500')}>
                            {production.draft_count} Draft
                        </span>
                    </div>
                </Link>
            )}

            {/* Card 4: Outstanding Checks Count as Main Value */}
            {(canViewRecon || canViewPayroll) && (
                <Link
                    href={canViewRecon ? '/BankReconciliation' : '/Payroll'}
                    className="group flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs transition-all hover:border-slate-300 hover:shadow-xs min-w-0 overflow-hidden"
                >
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">
                            Outstanding Checks
                        </span>
                        <Banknote className="size-4 text-slate-400 group-hover:text-slate-700 transition-colors shrink-0" />
                    </div>

                    <div className="my-2 min-w-0">
                        <div className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 truncate tabular-nums">
                            {formatNum(recon.outstanding_count, 0)}{' '}
                            <span className="text-xs font-normal text-slate-500">Checks</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 min-w-0">
                        <span className="truncate mr-1">{formatCurrency(recon.outstanding_amount)} ({recon.match_rate}% Matched)</span>
                        <span className={cn('shrink-0 font-medium', payroll.pending_count > 0 ? 'text-amber-700' : 'text-slate-500')}>
                            {payroll.pending_count} Pending Pay
                        </span>
                    </div>
                </Link>
            )}
        </div>
    );
};
