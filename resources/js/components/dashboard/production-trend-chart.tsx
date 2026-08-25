import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { BarChart3, LineChart, TrendingUp, Info } from 'lucide-react';

export type TrendMetricKey =
    | 'net_cw'
    | 'gross_cw'
    | 'actual_lkg'
    | 'pshr_net_lkg'
    | 'actual_mol'
    | 'trucks';

export interface TrendItem {
    label?: string;
    period_key?: string;
    crop_year: string;
    total_rows?: number;
    gross_cw: number;
    net_cw: number;
    trucks: number;
    actual_lkg: number;
    pshr_net_lkg: number;
    actual_mol: number;
    pshr_net_mol: number;
}

interface ProductionTrendChartProps {
    data: TrendItem[];
    selectedCropYear?: string | null;
    className?: string;
}

const metricOptions: { key: TrendMetricKey; label: string; unit: string; decimals: number }[] = [
    { key: 'net_cw', label: 'Net Cane Weight', unit: 'Tons', decimals: 2 },
    { key: 'gross_cw', label: 'Gross Cane Weight', unit: 'Tons', decimals: 2 },
    { key: 'actual_lkg', label: 'Sugar Yield', unit: 'LKG', decimals: 2 },
    { key: 'pshr_net_lkg', label: 'Planter Share Sugar', unit: 'LKG', decimals: 2 },
    { key: 'actual_mol', label: 'Molasses Output', unit: 'Mol', decimals: 2 },
    { key: 'trucks', label: 'Delivery Trucks', unit: 'Trucks', decimals: 0 },
];

function formatYAxisLabel(val: number): string {
    if (val >= 1_000_000) {
        return `${(val / 1_000_000).toFixed(1)}M`;
    }
    if (val >= 10_000) {
        return `${(val / 1_000).toFixed(0)}k`;
    }
    if (val >= 1_000) {
        return `${(val / 1_000).toFixed(1)}k`;
    }
    return val.toLocaleString('en-US', { maximumFractionDigits: 1 });
}

export const ProductionTrendChart: React.FC<ProductionTrendChartProps> = ({
    data = [],
    selectedCropYear,
    className,
}) => {
    const [metricKey, setMetricKey] = useState<TrendMetricKey>('net_cw');
    const [chartType, setChartType] = useState<'line' | 'bar'>('line');
    const [hoverIdx, setHoverIdx] = useState<number | null>(null);

    const activeOption = metricOptions.find((m) => m.key === metricKey) || metricOptions[0];

    // Find index matching selectedCropYear, or default to the latest crop year
    const selectedIdx = useMemo(() => {
        if (!selectedCropYear || selectedCropYear === 'all') {
            return data.length - 1;
        }
        const idx = data.findIndex(
            (d) => d.crop_year === selectedCropYear || d.label === selectedCropYear,
        );
        return idx >= 0 ? idx : data.length - 1;
    }, [data, selectedCropYear]);

    const activeIdx = hoverIdx !== null ? hoverIdx : (selectedIdx >= 0 ? selectedIdx : 0);

    const values = data.map((d) => Number(d[metricKey] ?? 0));
    const maxValue = Math.max(...values, 1);
    const minValue = 0; // Baseline at 0 for accurate visual comparison
    const range = maxValue - minValue || 1;

    const formatNum = (val: number) =>
        new Intl.NumberFormat('en-US', {
            minimumFractionDigits: activeOption.decimals,
            maximumFractionDigits: activeOption.decimals,
        }).format(val);

    const width = 680;
    const height = 230;
    const padding = { top: 24, right: 28, bottom: 40, left: 56 };
    const availableWidth = width - padding.left - padding.right;

    if (data.length === 0) {
        return (
            <div className={cn('rounded-xl border border-slate-200/80 bg-white p-8 text-center text-xs text-slate-400 shadow-2xs w-full min-w-0', className)}>
                No multi-year production trend records available.
            </div>
        );
    }

    // Compute tight, centered bar cluster spacing
    const numItems = data.length;
    const maxBarWidth = 56;
    const minBarWidth = 24;
    const desiredGap = numItems <= 4 ? 22 : numItems <= 8 ? 16 : 10;
    const naturalClusterWidth = numItems * maxBarWidth + (numItems - 1) * desiredGap;

    let barWidth = maxBarWidth;
    let itemSpacing = desiredGap;
    let startX = padding.left;

    if (naturalClusterWidth < availableWidth) {
        // Center the cluster in the chart area so bars are nicely close together
        startX = padding.left + (availableWidth - naturalClusterWidth) / 2;
    } else {
        const slotWidth = availableWidth / numItems;
        barWidth = Math.max(minBarWidth, slotWidth * 0.72);
        itemSpacing = slotWidth - barWidth;
        startX = padding.left + (slotWidth - barWidth) / 2;
    }

    const points = values.map((val, idx) => {
        const x = startX + idx * (barWidth + itemSpacing) + barWidth / 2;
        const y =
            padding.top +
            (1 - (val - minValue) / range) * (height - padding.top - padding.bottom);
        return {
            x,
            y,
            val,
            barX: x - barWidth / 2,
            barWidth,
            label: data[idx].label || data[idx].crop_year,
            cropYear: data[idx].crop_year,
        };
    });

    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaPath =
        points.length > 1
            ? `${linePath} L ${points[points.length - 1].x} ${height - padding.bottom} L ${points[0].x} ${height - padding.bottom} Z`
            : '';

    const activeItem = data[activeIdx] || data[data.length - 1] || null;

    return (
        <div
            className={cn(
                'flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-5 shadow-2xs transition-all hover:border-emerald-300 min-w-0 w-full overflow-hidden',
                className,
            )}
        >
            <div className="min-w-0">
                {/* Header Controls */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-slate-100 pb-3 mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-700 text-white shadow-2xs">
                            <TrendingUp className="size-4" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-sm font-bold tracking-tight text-slate-900 truncate">
                                Multi-Year Production Trends
                            </h3>
                            <p className="text-[11px] text-slate-400 truncate">
                                Overall historical trajectory across all crop years
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        {/* Line / Bar Toggle */}
                        <div className="flex items-center rounded-lg bg-slate-100 p-0.5 border border-slate-200">
                            <button
                                type="button"
                                onClick={() => setChartType('line')}
                                className={cn(
                                    'flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold transition-all',
                                    chartType === 'line'
                                        ? 'bg-white text-emerald-800 shadow-2xs'
                                        : 'text-slate-500 hover:text-emerald-700',
                                )}
                            >
                                <LineChart className="size-3" />
                                Line
                            </button>
                            <button
                                type="button"
                                onClick={() => setChartType('bar')}
                                className={cn(
                                    'flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold transition-all',
                                    chartType === 'bar'
                                        ? 'bg-white text-emerald-800 shadow-2xs'
                                        : 'text-slate-500 hover:text-emerald-700',
                                )}
                            >
                                <BarChart3 className="size-3" />
                                Bar
                            </button>
                        </div>

                        {/* Metric Selector */}
                        <select
                            value={metricKey}
                            onChange={(e) => setMetricKey(e.target.value as TrendMetricKey)}
                            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-900 shadow-2xs focus:border-emerald-500 focus:outline-none"
                        >
                            {metricOptions.map((opt) => (
                                <option key={opt.key} value={opt.key}>
                                    {opt.label} ({opt.unit})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* SVG Graph Container */}
                <div className="relative w-full overflow-hidden">
                    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto block select-none">
                        <defs>
                            <linearGradient id="emeraldGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#148c1a" stopOpacity="0.25" />
                                <stop offset="100%" stopColor="#148c1a" stopOpacity="0.01" />
                            </linearGradient>
                            <linearGradient id="singleColEmeraldGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#148c1a" stopOpacity="0.30" />
                                <stop offset="100%" stopColor="#148c1a" stopOpacity="0.03" />
                            </linearGradient>
                        </defs>

                        {/* Grid lines */}
                        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                            const y = padding.top + ratio * (height - padding.top - padding.bottom);
                            const labelVal = maxValue - ratio * range;
                            return (
                                <g key={`grid-${idx}`}>
                                    <line
                                        x1={padding.left}
                                        x2={width - padding.right}
                                        y1={y}
                                        y2={y}
                                        stroke="#f1f5f9"
                                        strokeDasharray="3 3"
                                    />
                                    <text
                                        x={padding.left - 6}
                                        y={y + 3}
                                        textAnchor="end"
                                        fontSize="9.5"
                                        fontWeight="500"
                                        fill="#94a3b8"
                                    >
                                        {formatYAxisLabel(labelVal)}
                                    </text>
                                </g>
                            );
                        })}

                        {/* Line or Bar chart */}
                        {chartType === 'line' ? (
                            <>
                                {points.length > 1 ? (
                                    <>
                                        <path d={areaPath} fill="url(#emeraldGradient)" />
                                        <path
                                            d={linePath}
                                            fill="none"
                                            stroke="#148c1a"
                                            strokeWidth="2.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </>
                                ) : (
                                    /* Single point representation: shaded column + dashed benchmark */
                                    <g>
                                        <rect
                                            x={points[0].barX}
                                            y={points[0].y}
                                            width={points[0].barWidth}
                                            height={height - padding.bottom - points[0].y}
                                            rx={6}
                                            fill="url(#singleColEmeraldGradient)"
                                        />
                                        <line
                                            x1={padding.left}
                                            x2={width - padding.right}
                                            y1={points[0].y}
                                            y2={points[0].y}
                                            stroke="#148c1a"
                                            strokeDasharray="4 4"
                                            strokeWidth="1.5"
                                            opacity="0.4"
                                        />
                                    </g>
                                )}

                                {points.map((p, idx) => {
                                    const isCurrentActive = activeIdx === idx;
                                    const isSelectedCY = selectedCropYear && p.cropYear === selectedCropYear;

                                    return (
                                        <g
                                            key={`pt-${idx}`}
                                            className="cursor-pointer"
                                            onMouseEnter={() => setHoverIdx(idx)}
                                            onMouseLeave={() => setHoverIdx(null)}
                                        >
                                            {isCurrentActive && (
                                                <circle
                                                    cx={p.x}
                                                    cy={p.y}
                                                    r={12}
                                                    fill="#148c1a"
                                                    opacity="0.15"
                                                />
                                            )}
                                            <circle
                                                cx={p.x}
                                                cy={p.y}
                                                r={isCurrentActive || isSelectedCY ? 6 : 4}
                                                fill={isCurrentActive || isSelectedCY ? '#148c1a' : '#ffffff'}
                                                stroke="#148c1a"
                                                strokeWidth={isCurrentActive || isSelectedCY ? 2.5 : 2}
                                                className="transition-all duration-150"
                                            />
                                        </g>
                                    );
                                })}
                            </>
                        ) : (
                            <g>
                                {points.map((p, idx) => {
                                    const barH = Math.max(4, height - padding.bottom - p.y);
                                    const isCurrentActive = activeIdx === idx;
                                    const isSelectedCY = selectedCropYear && p.cropYear === selectedCropYear;

                                    return (
                                        <rect
                                            key={`bar-${idx}`}
                                            x={p.barX}
                                            y={p.y}
                                            width={p.barWidth}
                                            height={barH}
                                            rx={4}
                                            fill={isCurrentActive || isSelectedCY ? '#148c1a' : '#64748b'}
                                            opacity={isCurrentActive || isSelectedCY ? 1 : 0.45}
                                            className="cursor-pointer transition-all hover:opacity-100"
                                            onMouseEnter={() => setHoverIdx(idx)}
                                            onMouseLeave={() => setHoverIdx(null)}
                                        />
                                    );
                                })}
                            </g>
                        )}

                        {/* X-axis crop year labels */}
                        {points.map((p, idx) => {
                            const isCurrentActive = activeIdx === idx;
                            const isSelectedCY = selectedCropYear && p.cropYear === selectedCropYear;

                            return (
                                <g
                                    key={`x-group-${idx}`}
                                    className="cursor-pointer"
                                    onMouseEnter={() => setHoverIdx(idx)}
                                    onMouseLeave={() => setHoverIdx(null)}
                                >
                                    <text
                                        x={p.x}
                                        y={height - padding.bottom + 18}
                                        textAnchor="middle"
                                        fontSize="10.5"
                                        fontWeight={isCurrentActive || isSelectedCY ? '800' : '500'}
                                        fill={isCurrentActive || isSelectedCY ? '#148c1a' : '#64748b'}
                                    >
                                        {p.cropYear}
                                    </text>
                                    {(isCurrentActive || isSelectedCY) && (
                                        <circle
                                            cx={p.x}
                                            cy={height - padding.bottom + 26}
                                            r={2}
                                            fill="#148c1a"
                                        />
                                    )}
                                </g>
                            );
                        })}
                    </svg>
                </div>
            </div>

            {/* Footer Summary Tile */}
            {activeItem && (
                <div className="mt-2.5 rounded-lg bg-emerald-50/70 border border-emerald-100/80 p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                        <Info className="size-3.5 text-emerald-700 shrink-0" />
                        <span className="text-[11px] text-emerald-900 truncate">
                            <strong>Crop Year {activeItem.crop_year}:</strong> {activeOption.label} ={' '}
                            <span className="font-bold text-emerald-950">
                                {formatNum(Number(activeItem[metricKey] ?? 0))} {activeOption.unit}
                            </span>
                        </span>
                    </div>

                    <div className="flex items-center gap-2.5 text-[10.5px] text-emerald-800/80 shrink-0">
                        <span>Net: <strong>{formatNum(activeItem.net_cw)}t</strong></span>
                        <span>Sugar: <strong>{formatNum(activeItem.actual_lkg)} LKG</strong></span>
                        <span>Trucks: <strong>{activeItem.trucks}</strong></span>
                    </div>
                </div>
            )}
        </div>
    );
};
