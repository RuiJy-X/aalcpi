import React, { useState, useMemo } from 'react';
import { Link } from '@inertiajs/react';
import { Trophy, Search, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PlanterLeaderboardItem {
    planter_id: number;
    planter_name: string;
    hacienda_name: string;
    gross_cw: number;
    net_cw: number;
    trucks: number;
    actual_lkg: number;
    pshr_net_lkg: number;
    actual_mol: number;
    pshr_net_mol: number;
}

interface PlanterLeaderboardProps {
    leaderboard: PlanterLeaderboardItem[];
    selectedCropYear?: string | null;
    className?: string;
}

type LeaderboardMetricKey =
    | 'net_cw'
    | 'gross_cw'
    | 'actual_lkg'
    | 'pshr_net_lkg'
    | 'trucks';

const metricOptions: { key: LeaderboardMetricKey; label: string; unit: string; decimals: number }[] = [
    { key: 'net_cw', label: 'Net CW', unit: 'Tons', decimals: 2 },
    { key: 'gross_cw', label: 'Gross CW', unit: 'Tons', decimals: 2 },
    { key: 'actual_lkg', label: 'Sugar LKG', unit: 'LKG', decimals: 2 },
    { key: 'pshr_net_lkg', label: 'Pshr Net LKG', unit: 'LKG', decimals: 2 },
    { key: 'trucks', label: 'Trucks', unit: 'Trucks', decimals: 0 },
];

export const PlanterLeaderboard: React.FC<PlanterLeaderboardProps> = ({
    leaderboard = [],
    selectedCropYear,
    className,
}) => {
    const [metricKey, setMetricKey] = useState<LeaderboardMetricKey>('net_cw');
    const [search, setSearch] = useState('');

    const activeOption = metricOptions.find((m) => m.key === metricKey) || metricOptions[0];

    const sortedData = useMemo(() => {
        return [...leaderboard]
            .sort((a, b) => Number(b[metricKey] ?? 0) - Number(a[metricKey] ?? 0))
            .filter((item) =>
                item.planter_name.toLowerCase().includes(search.toLowerCase()) ||
                item.hacienda_name.toLowerCase().includes(search.toLowerCase()),
            );
    }, [leaderboard, metricKey, search]);

    const maxVal = useMemo(() => {
        if (sortedData.length === 0) return 1;
        return Math.max(...sortedData.map((d) => Number(d[metricKey] ?? 0)), 1);
    }, [sortedData, metricKey]);

    const formatVal = (val: number) =>
        new Intl.NumberFormat('en-US', {
            minimumFractionDigits: activeOption.decimals,
            maximumFractionDigits: activeOption.decimals,
        }).format(val);

    return (
        <div
            className={cn(
                'flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-5 shadow-2xs transition-all hover:border-slate-300 min-w-0 w-full overflow-hidden',
                className,
            )}
        >
            <div className="min-w-0">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-slate-100 pb-3 mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                            <Trophy className="size-4" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-sm font-bold tracking-tight text-slate-900 truncate">
                                Planters Leaderboard
                            </h3>
                            <p className="text-[11px] text-slate-400 truncate">
                                Top volume suppliers for {selectedCropYear === 'all' ? 'all seasons' : selectedCropYear ? `CY ${selectedCropYear}` : 'period'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        {/* Search input */}
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Filter planter..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-28 sm:w-32 rounded-lg border border-slate-200 bg-slate-50 pl-7 pr-2 py-1 text-xs text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none"
                            />
                        </div>

                        {/* Metric Selector */}
                        <select
                            value={metricKey}
                            onChange={(e) => setMetricKey(e.target.value as LeaderboardMetricKey)}
                            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-900 shadow-2xs focus:border-slate-400 focus:outline-none"
                        >
                            {metricOptions.map((opt) => (
                                <option key={opt.key} value={opt.key}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Ranked List */}
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 min-w-0">
                    {sortedData.slice(0, 10).map((row, idx) => {
                        const val = Number(row[metricKey] ?? 0);
                        const pct = Math.round((val / maxVal) * 100);

                        const rankStyles =
                            idx === 0
                                ? 'bg-amber-500 text-white font-bold'
                                : idx === 1
                                  ? 'bg-slate-700 text-white font-bold'
                                  : idx === 2
                                    ? 'bg-amber-700 text-white font-bold'
                                    : 'bg-slate-100 text-slate-600 font-semibold';

                        return (
                            <div
                                key={row.planter_id || idx}
                                className="flex flex-col rounded-lg border border-slate-100 bg-slate-50/40 p-2.5 transition-all hover:bg-slate-50 min-w-0"
                            >
                                <div className="flex items-center justify-between gap-2.5 min-w-0">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span
                                            className={cn(
                                                'flex size-5 shrink-0 items-center justify-center rounded-full text-[10.5px]',
                                                rankStyles,
                                            )}
                                        >
                                            #{idx + 1}
                                        </span>
                                        <div className="min-w-0">
                                            <h4 className="text-xs font-bold text-slate-900 truncate leading-tight">
                                                {row.planter_name || 'Unnamed Planter'}
                                            </h4>
                                            <p className="text-[10.5px] text-slate-400 truncate">
                                                {row.hacienda_name || 'No Hacienda'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="text-right shrink-0">
                                        <div className="text-xs font-bold text-slate-900 tabular-nums">
                                            {formatVal(val)} <span className="text-[10px] font-normal text-slate-400">{activeOption.unit}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Volume Bar */}
                                <div className="mt-1.5 w-full bg-slate-200/80 h-1 rounded-full overflow-hidden flex">
                                    <div
                                        className={cn(
                                            'h-full rounded-full transition-all duration-300',
                                            idx === 0 ? 'bg-amber-500' : 'bg-slate-700',
                                        )}
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}

                    {sortedData.length === 0 && (
                        <div className="py-6 text-center text-xs text-slate-400">
                            No planters match your search.
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Navigation */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">
                    {leaderboard.length} active planters
                </span>

                <Link
                    href="/Planters"
                    className="inline-flex items-center gap-1 font-semibold text-slate-700 hover:text-slate-900 transition-colors"
                >
                    <span>Planters Directory</span>
                    <ArrowRight className="size-3" />
                </Link>
            </div>
        </div>
    );
};
