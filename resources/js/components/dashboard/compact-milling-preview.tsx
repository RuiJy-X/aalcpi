import React, { useState, useMemo } from 'react';
import { Link } from '@inertiajs/react';
import { ShieldCheck, Calendar, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MillingPeriodItem {
    id: number;
    week_no: number;
    crop_year: string;
    start_date: string;
    end_date: string;
    sugar_price: number;
    mol_price: number;
    sugar_factor?: number | null;
    mol_factor?: number | null;
}

interface CompactMillingPreviewProps {
    activePeriod: MillingPeriodItem | null;
    periods: MillingPeriodItem[];
    selectedCropYear?: string | null;
    className?: string;
}

function formatDateRange(start: string, end: string): string {
    if (!start || !end) return '—';
    try {
        const s = new Date(start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const e = new Date(end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        return `${s} – ${e}`;
    } catch {
        return `${start} – ${end}`;
    }
}

function formatPrice(val: number): string {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number.isFinite(val) ? val : 0);
}

export const CompactMillingPreview: React.FC<CompactMillingPreviewProps> = ({
    activePeriod,
    periods = [],
    selectedCropYear,
    className,
}) => {
    const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(
        activePeriod?.id || periods[0]?.id || null,
    );

    const displayPeriod = useMemo(() => {
        if (!periods || periods.length === 0) return null;
        if (selectedPeriodId) {
            const found = periods.find((p) => p.id === selectedPeriodId);
            if (found) return found;
        }
        return activePeriod || periods[0] || null;
    }, [periods, selectedPeriodId, activePeriod]);

    const currentIndex = useMemo(() => {
        if (!displayPeriod || periods.length === 0) return -1;
        return periods.findIndex((p) => p.id === displayPeriod.id);
    }, [periods, displayPeriod]);

    const hasPrev = currentIndex > 0;
    const hasNext = currentIndex >= 0 && currentIndex < periods.length - 1;

    const handlePrev = () => {
        if (hasPrev) {
            setSelectedPeriodId(periods[currentIndex - 1].id);
        }
    };

    const handleNext = () => {
        if (hasNext) {
            setSelectedPeriodId(periods[currentIndex + 1].id);
        }
    };

    // Windowed week pills: if lots of weeks (e.g. 50-100), show a 7-week window around the selected week
    const visiblePillWeeks = useMemo(() => {
        if (periods.length <= 12) return periods;
        const start = Math.max(0, currentIndex - 3);
        const end = Math.min(periods.length, start + 7);
        const adjustedStart = Math.max(0, end - 7);
        return periods.slice(adjustedStart, end);
    }, [periods, currentIndex]);

    return (
        <div
            className={cn(
                'flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-5 shadow-2xs transition-all hover:border-emerald-300 min-w-0 w-full overflow-hidden',
                className,
            )}
        >
            <div className="min-w-0">
                {/* Header */}
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-700 text-white shadow-2xs">
                            <ShieldCheck className="size-4" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-sm font-bold tracking-tight text-slate-900 truncate">
                                Milling Period & Prices
                            </h3>
                            <p className="text-[11px] text-slate-400 truncate">
                                Active week and benchmark prices
                            </p>
                        </div>
                    </div>

                    <span className="shrink-0 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 border border-emerald-200/60">
                        {selectedCropYear === 'all' ? 'All Seasons' : selectedCropYear ? `CY ${selectedCropYear}` : 'Active Season'}
                    </span>
                </div>

                {displayPeriod ? (
                    <div className="mt-3.5 space-y-3 min-w-0">
                        {/* Active Period Highlight Card */}
                        <div className="rounded-xl border border-emerald-100/80 bg-emerald-50/40 p-3.5 min-w-0">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                    {activePeriod?.id === displayPeriod.id ? (
                                        <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                                    ) : (
                                        <span className="flex size-2 rounded-full bg-slate-300 shrink-0" />
                                    )}
                                    <span className="text-sm font-bold text-slate-900 truncate">
                                        Milling Week {displayPeriod.week_no}
                                    </span>
                                    {activePeriod?.id === displayPeriod.id && (
                                        <span className="rounded-full bg-emerald-200/70 text-emerald-900 text-[10px] font-extrabold px-1.5 py-0.2 shrink-0">
                                            Current
                                        </span>
                                    )}
                                </div>

                                <span className="inline-flex items-center gap-1 rounded-md bg-white border border-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-600 shadow-2xs shrink-0">
                                    <Calendar className="size-3 text-slate-400 shrink-0" />
                                    {formatDateRange(displayPeriod.start_date, displayPeriod.end_date)}
                                </span>
                            </div>

                            {/* Benchmark Price Grid */}
                            <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                                <div className="flex items-center justify-between rounded-lg bg-white p-2 border border-slate-200/80 shadow-2xs min-w-0">
                                    <span className="text-[11px] text-slate-500 truncate mr-2">Sugar Rate:</span>
                                    <span className="text-xs font-black text-slate-900 shrink-0 tabular-nums">
                                        ₱{formatPrice(Number(displayPeriod.sugar_price))}
                                        <span className="text-[10px] font-normal text-slate-400">/LKG</span>
                                    </span>
                                </div>

                                <div className="flex items-center justify-between rounded-lg bg-white p-2 border border-slate-200/80 shadow-2xs min-w-0">
                                    <span className="text-[11px] text-slate-500 truncate mr-2">Molasses:</span>
                                    <span className="text-xs font-black text-slate-900 shrink-0 tabular-nums">
                                        ₱{formatPrice(Number(displayPeriod.mol_price))}
                                        <span className="text-[10px] font-normal text-slate-400">/MT</span>
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Fallback-Safe Week Navigator (Handles 1 to 100+ weeks seamlessly) */}
                        {periods.length > 0 && (
                            <div className="min-w-0 pt-1">
                                <div className="flex items-center justify-between gap-2 mb-1.5">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                        Select Week ({periods.length} Total)
                                    </span>

                                    {/* Stepper buttons for fast navigation */}
                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            disabled={!hasPrev}
                                            onClick={handlePrev}
                                            className="flex size-5 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 hover:bg-emerald-50 hover:text-emerald-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                                            title="Previous week"
                                        >
                                            <ChevronLeft className="size-3" />
                                        </button>
                                        <button
                                            type="button"
                                            disabled={!hasNext}
                                            onClick={handleNext}
                                            className="flex size-5 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 hover:bg-emerald-50 hover:text-emerald-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                                            title="Next week"
                                        >
                                            <ChevronRight className="size-3" />
                                        </button>
                                    </div>
                                </div>

                                {/* When many weeks (>12), provide dropdown + windowed pills */}
                                {periods.length > 12 ? (
                                    <div className="flex items-center gap-2 min-w-0">
                                        <select
                                            value={displayPeriod.id}
                                            onChange={(e) => setSelectedPeriodId(Number(e.target.value))}
                                            className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-900 shadow-2xs focus:border-emerald-500 focus:outline-none"
                                        >
                                            {periods.map((p) => (
                                                <option key={p.id} value={p.id}>
                                                    Week {p.week_no} ({formatDateRange(p.start_date, p.end_date)}) — ₱{formatPrice(Number(p.sugar_price))}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                ) : (
                                    /* When 12 or fewer weeks, show smooth clean badge strip */
                                    <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none min-w-0">
                                        {visiblePillWeeks.map((p) => {
                                            const isSelected = displayPeriod.id === p.id;
                                            return (
                                                <button
                                                    key={p.id}
                                                    type="button"
                                                    onClick={() => setSelectedPeriodId(p.id)}
                                                    className={cn(
                                                        'px-2 py-0.5 rounded-md text-[11px] font-bold shrink-0 transition-all border',
                                                        isSelected
                                                            ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                                                            : 'bg-white text-slate-700 border-slate-200 hover:bg-emerald-50 hover:border-emerald-200',
                                                    )}
                                                >
                                                    W{p.week_no}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="py-6 text-center text-xs text-slate-400">
                        No milling periods defined for this crop year.
                    </div>
                )}
            </div>

            {/* Footer Navigation */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">
                    {periods.length} weeks scheduled
                </span>

                <Link
                    href="/MillingPeriods"
                    className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
                >
                    <span>Milling Calendar</span>
                    <ArrowRight className="size-3" />
                </Link>
            </div>
        </div>
    );
};
