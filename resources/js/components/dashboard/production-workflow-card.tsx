import React from 'react';
import { Link } from '@inertiajs/react';
import { BookOpen, Scale, Droplets, Truck, ArrowRight, CheckCircle2, FileEdit } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ProductionWorkflowData {
    total_rows: number;
    draft_count: number;
    completed_count: number;
    percent_complete: number;
    gross_cw: number;
    net_cw: number;
    trucks: number;
    actual_lkg: number;
    pshr_net_lkg: number;
    mill_share_lkg: number;
    actual_mol: number;
    pshr_net_mol: number;
    mill_share_mol: number;
}

interface ProductionWorkflowProps {
    data: ProductionWorkflowData;
    className?: string;
}

function formatNum(val: number, decimals = 2): string {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(Number.isFinite(val) ? val : 0);
}

export const ProductionWorkflowCard: React.FC<ProductionWorkflowProps> = ({
    data,
    className,
}) => {
    return (
        <div className={cn('space-y-3', className)}>
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-base font-bold tracking-tight text-slate-900">
                        Sugarcane Production & Yield Workflow
                    </h2>
                    <p className="text-xs text-slate-500">
                        Delivery tickets, cane weight tonnage, and sugar & molasses yield allocation
                    </p>
                </div>

                <Link
                    href="/Productions"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
                >
                    <span>Open Productions</span>
                    <ArrowRight className="size-3.5" />
                </Link>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Card 1: Production Records & Completion Pipeline */}
                <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-slate-300">
                    <div>
                        <div className="flex items-start justify-between gap-2">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                Production Records
                            </span>
                            <div className="flex size-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                                <BookOpen className="size-4" />
                            </div>
                        </div>

                        <div className="mt-2">
                            <h3 className="text-2xl font-black tracking-tight text-slate-900">
                                {formatNum(data.total_rows, 0)}{' '}
                                <span className="text-xs font-medium text-slate-500">rows</span>
                            </h3>
                        </div>

                        <div className="mt-3 flex items-center justify-between text-xs font-semibold">
                            <span className="flex items-center gap-1 text-emerald-700">
                                <CheckCircle2 className="size-3.5" />
                                {formatNum(data.completed_count, 0)} Completed
                            </span>
                            <span className="flex items-center gap-1 text-amber-700">
                                <FileEdit className="size-3.5" />
                                {formatNum(data.draft_count, 0)} Draft
                            </span>
                        </div>

                        {/* Progress bar */}
                        <div className="mt-2 w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
                            <div
                                className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                                style={{ width: `${data.percent_complete}%` }}
                            />
                        </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span>Completion Rate:</span>
                        <span className="font-bold text-slate-900">{data.percent_complete}%</span>
                    </div>
                </div>

                {/* Card 2: Cane Weight Volume (Net CW & Gross CW) */}
                <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-slate-300">
                    <div>
                        <div className="flex items-start justify-between gap-2">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                Net Cane Weight
                            </span>
                            <div className="flex size-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                                <Scale className="size-4" />
                            </div>
                        </div>

                        <div className="mt-2">
                            <h3 className="text-2xl font-black tracking-tight text-slate-900">
                                {formatNum(data.net_cw, 2)}{' '}
                                <span className="text-xs font-medium text-slate-500">Tons</span>
                            </h3>
                        </div>

                        <div className="mt-3 rounded-xl bg-slate-50 p-2.5 space-y-1 text-xs">
                            <div className="flex items-center justify-between text-slate-600">
                                <span>Gross CW:</span>
                                <span className="font-bold text-slate-900">{formatNum(data.gross_cw, 2)} t</span>
                            </div>
                            <div className="flex items-center justify-between text-slate-600">
                                <span>Delivery Trucks:</span>
                                <span className="font-bold text-slate-900">{formatNum(data.trucks, 0)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span>Avg Tons/Truck:</span>
                        <span className="font-bold text-slate-900">
                            {data.trucks > 0 ? formatNum(data.net_cw / data.trucks, 2) : '0.00'} t
                        </span>
                    </div>
                </div>

                {/* Card 3: Sugar Yield (Actual LKG & Planter Share) */}
                <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-slate-300">
                    <div>
                        <div className="flex items-start justify-between gap-2">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                Sugar Production
                            </span>
                            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                                <Scale className="size-4" />
                            </div>
                        </div>

                        <div className="mt-2">
                            <h3 className="text-2xl font-black tracking-tight text-slate-900">
                                {formatNum(data.actual_lkg, 2)}{' '}
                                <span className="text-xs font-medium text-slate-500">LKG</span>
                            </h3>
                        </div>

                        <div className="mt-3 rounded-xl bg-slate-50 p-2.5 space-y-1 text-xs">
                            <div className="flex items-center justify-between text-slate-600">
                                <span>Planter Share:</span>
                                <span className="font-bold text-emerald-800">{formatNum(data.pshr_net_lkg, 2)} LKG</span>
                            </div>
                            <div className="flex items-center justify-between text-slate-600">
                                <span>Mill Share:</span>
                                <span className="font-bold text-slate-900">{formatNum(data.mill_share_lkg, 2)} LKG</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span>Planter Ratio:</span>
                        <span className="font-bold text-slate-900">
                            {data.actual_lkg > 0 ? Math.round((data.pshr_net_lkg / data.actual_lkg) * 100) : 0}%
                        </span>
                    </div>
                </div>

                {/* Card 4: Molasses Output (Actual Mol & Planter Share) */}
                <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-slate-300">
                    <div>
                        <div className="flex items-start justify-between gap-2">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                Molasses Output
                            </span>
                            <div className="flex size-8 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                                <Droplets className="size-4" />
                            </div>
                        </div>

                        <div className="mt-2">
                            <h3 className="text-2xl font-black tracking-tight text-slate-900">
                                {formatNum(data.actual_mol, 2)}{' '}
                                <span className="text-xs font-medium text-slate-500">Mol</span>
                            </h3>
                        </div>

                        <div className="mt-3 rounded-xl bg-slate-50 p-2.5 space-y-1 text-xs">
                            <div className="flex items-center justify-between text-slate-600">
                                <span>Planter Share:</span>
                                <span className="font-bold text-teal-800">{formatNum(data.pshr_net_mol, 2)} Mol</span>
                            </div>
                            <div className="flex items-center justify-between text-slate-600">
                                <span>Mill Share:</span>
                                <span className="font-bold text-slate-900">{formatNum(data.mill_share_mol, 2)} Mol</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span>Planter Ratio:</span>
                        <span className="font-bold text-slate-900">
                            {data.actual_mol > 0 ? Math.round((data.pshr_net_mol / data.actual_mol) * 100) : 0}%
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};
