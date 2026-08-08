import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Trophy, Search, Award } from 'lucide-react';
import { MetricKey } from './tarsi-trend-chart';
import { SegmentedProgressBar } from './tarsi-components';

export interface LeaderboardItem {
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

interface TarsiLeaderboardProps {
    leaderboard: LeaderboardItem[];
    selectedCropYear?: string | null;
}

const metricOptions: { key: MetricKey; label: string; decimals: number }[] = [
    { key: 'gross_cw', label: 'Gross CW', decimals: 2 },
    { key: 'net_cw', label: 'Net CW', decimals: 2 },
    { key: 'trucks', label: 'Trucks', decimals: 0 },
    { key: 'pshr_net_lkg', label: 'Pshr Net LKG', decimals: 2 },
    { key: 'actual_lkg', label: 'Actual LKG', decimals: 2 },
    { key: 'actual_mol', label: 'Actual Mol', decimals: 2 },
    { key: 'pshr_net_mol', label: 'Pshr Net Mol', decimals: 2 },
];

export const TarsiLeaderboard: React.FC<TarsiLeaderboardProps> = ({
    leaderboard,
    selectedCropYear,
}) => {
    const [metricKey, setMetricKey] = useState<MetricKey>('gross_cw');
    const [searchTerm, setSearchTerm] = useState('');

    const selectedOption = metricOptions.find((m) => m.key === metricKey);
    const decimals = selectedOption?.decimals ?? 2;

    const sortedData = useMemo(() => {
        return [...leaderboard]
            .sort((a, b) => Number(b[metricKey] ?? 0) - Number(a[metricKey] ?? 0))
            .filter((item) =>
                item.planter_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.hacienda_name.toLowerCase().includes(searchTerm.toLowerCase()),
            );
    }, [leaderboard, metricKey, searchTerm]);

    const maxVal = useMemo(() => {
        if (sortedData.length === 0) return 1;
        return Math.max(...sortedData.map((d) => Number(d[metricKey] ?? 0)), 1);
    }, [sortedData, metricKey]);

    const formatVal = (val: number) =>
        new Intl.NumberFormat('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        }).format(val);

    return (
        <div className="rounded-[18px] border border-[#E7E6E2] bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            {/* Top Header & Selector */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#E7E6E2] pb-4 mb-4">
                <div className="flex items-center gap-2.5">
                    <div className="flex size-9 items-center justify-center rounded-[10px] bg-[#E7F0E5] text-[#1F4B32]">
                        <Trophy className="size-5" />
                    </div>
                    <div>
                        <h3 className="text-[17px] font-semibold text-[#1B1B18] leading-tight">
                            Planters Leaderboard
                        </h3>
                        <p className="text-xs text-[#6E6E68]">
                            Top producers for {selectedCropYear ? `Crop Year ${selectedCropYear}` : 'selected period'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Search input */}
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[#A5A49E]" />
                        <input
                            type="text"
                            placeholder="Filter planter..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-36 rounded-lg border border-[#E7E6E2] bg-[#F2F1EE] pl-8 pr-2.5 py-1 text-xs text-[#1B1B18] placeholder-[#A5A49E] focus:border-[#1F4B32] focus:bg-white focus:outline-none"
                        />
                    </div>

                    {/* Metric Select */}
                    <select
                        value={metricKey}
                        onChange={(e) => setMetricKey(e.target.value as MetricKey)}
                        className="rounded-lg border border-[#E7E6E2] bg-white px-3 py-1 text-xs font-semibold text-[#1B1B18] shadow-xs focus:border-[#1F4B32] focus:outline-none"
                    >
                        {metricOptions.map((opt) => (
                            <option key={opt.key} value={opt.key}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Leaderboard Table / List */}
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {sortedData.slice(0, 10).map((row, index) => {
                    const value = Number(row[metricKey] ?? 0);
                    const percentOfTop = Math.round((value / maxVal) * 100);

                    // Rank Styling
                    const rankBadge =
                        index === 0
                            ? 'bg-[#1F4B32] text-white font-bold'
                            : index === 1
                              ? 'bg-[#2F6B3F] text-white font-bold'
                              : index === 2
                                ? 'bg-[#E7F0E5] text-[#1F4B32] font-semibold'
                                : 'bg-[#F2F1EE] text-[#6E6E68] font-medium';

                    return (
                        <div
                            key={row.planter_id || index}
                            className="flex flex-col rounded-[12px] border border-[#E7E6E2] bg-[#FFFFFF] p-3 transition-all hover:bg-[#F2F1EE]/50 hover:border-[#1F4B32]/30"
                        >
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <span
                                        className={cn(
                                            'flex size-7 shrink-0 items-center justify-center rounded-full text-xs',
                                            rankBadge,
                                        )}
                                    >
                                        #{index + 1}
                                    </span>
                                    <div>
                                        <h4 className="text-sm font-semibold text-[#1B1B18] leading-tight">
                                            {row.planter_name || 'Unknown Planter'}
                                        </h4>
                                        <p className="text-xs text-[#6E6E68]">
                                            {row.hacienda_name || 'Unassigned Hacienda'}
                                        </p>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <div className="text-sm font-bold text-[#1B1B18]">
                                        {formatVal(value)}
                                    </div>
                                    <div className="text-[11px] text-[#A5A49E]">
                                        {selectedOption?.label}
                                    </div>
                                </div>
                            </div>

                            {/* Relative Progress block */}
                            <div className="mt-2 pt-1">
                                <SegmentedProgressBar
                                    value={percentOfTop}
                                    segments={12}
                                    showPercent={false}
                                    barHeight="h-1.5"
                                />
                            </div>
                        </div>
                    );
                })}

                {sortedData.length === 0 && (
                    <div className="py-8 text-center text-xs text-[#6E6E68]">
                        No planters match your criteria.
                    </div>
                )}
            </div>
        </div>
    );
};
