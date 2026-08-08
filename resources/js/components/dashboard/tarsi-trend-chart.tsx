import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { BarChart3, LineChart, Layers, Info } from 'lucide-react';

export type MetricKey =
    | 'gross_cw'
    | 'net_cw'
    | 'trucks'
    | 'pshr_net_lkg'
    | 'actual_lkg'
    | 'actual_mol'
    | 'pshr_net_mol';

export interface TrendItem {
    crop_year: string;
    gross_cw: number;
    net_cw: number;
    trucks: number;
    actual_lkg: number;
    pshr_net_lkg: number;
    actual_mol: number;
    pshr_net_mol: number;
}

interface TarsiTrendChartProps {
    data: TrendItem[];
    metricKey: MetricKey;
    metricLabel: string;
    onMetricChange: (key: MetricKey) => void;
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

export const TarsiTrendChart: React.FC<TarsiTrendChartProps> = ({
    data,
    metricKey,
    metricLabel,
    onMetricChange,
}) => {
    const [chartType, setChartType] = useState<'line' | 'bar'>('line');
    const [activePointIndex, setActivePointIndex] = useState<number | null>(null);

    const values = data.map((d) => Number(d[metricKey] ?? 0));
    const maxValue = Math.max(...values, 1);
    const minValue = Math.min(...values, 0);
    const range = maxValue - minValue || 1;

    const selectedOption = metricOptions.find((m) => m.key === metricKey);
    const decimals = selectedOption?.decimals ?? 2;

    const formatNum = (val: number) =>
        new Intl.NumberFormat('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        }).format(val);

    const width = 760;
    const height = 280;
    const padding = { top: 30, right: 30, bottom: 50, left: 60 };

    if (data.length === 0) {
        return (
            <div className="rounded-[18px] border border-[#E7E6E2] bg-white p-8 text-center text-sm text-[#6E6E68]">
                No production trend data available for display.
            </div>
        );
    }

    const points = values.map((val, idx) => {
        const x =
            padding.left +
            (idx / Math.max(values.length - 1, 1)) *
                (width - padding.left - padding.right);
        const y =
            padding.top +
            (1 - (val - minValue) / range) *
                (height - padding.top - padding.bottom);
        return { x, y, val, cropYear: data[idx].crop_year };
    });

    const linePath = points
        .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
        .join(' ');

    const areaPath = `${linePath} L ${width - padding.right} ${height - padding.bottom} L ${padding.left} ${height - padding.bottom} Z`;

    const activeItem =
        activePointIndex !== null ? data[activePointIndex] : null;

    return (
        <div className="rounded-[18px] border border-[#E7E6E2] bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            {/* Header controls */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#E7E6E2] pb-4 mb-4">
                <div>
                    <h3 className="text-[17px] font-semibold text-[#1B1B18] leading-tight">
                        Crop Year Production Trends
                    </h3>
                    <p className="text-xs text-[#6E6E68]">
                        Comparative historical data across crop years
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* View Mode Toggle */}
                    <div className="flex items-center rounded-lg bg-[#F2F1EE] p-1 border border-[#E7E6E2]">
                        <button
                            onClick={() => setChartType('line')}
                            className={cn(
                                'flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition-all',
                                chartType === 'line'
                                    ? 'bg-white text-[#1F4B32] shadow-xs'
                                    : 'text-[#6E6E68] hover:text-[#1B1B18]',
                            )}
                        >
                            <LineChart className="size-3.5" />
                            Line
                        </button>
                        <button
                            onClick={() => setChartType('bar')}
                            className={cn(
                                'flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition-all',
                                chartType === 'bar'
                                    ? 'bg-white text-[#1F4B32] shadow-xs'
                                    : 'text-[#6E6E68] hover:text-[#1B1B18]',
                            )}
                        >
                            <BarChart3 className="size-3.5" />
                            Bar
                        </button>
                    </div>

                    {/* Metric Selector */}
                    <select
                        value={metricKey}
                        onChange={(e) =>
                            onMetricChange(e.target.value as MetricKey)
                        }
                        className="rounded-lg border border-[#E7E6E2] bg-white px-3 py-1.5 text-xs font-semibold text-[#1B1B18] shadow-xs focus:border-[#1F4B32] focus:outline-none"
                    >
                        {metricOptions.map((opt) => (
                            <option key={opt.key} value={opt.key}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Main Graph Area */}
            <div className="relative w-full overflow-hidden">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
                    <defs>
                        <linearGradient
                            id="tarsiBrandGradient"
                            x1="0%"
                            y1="0%"
                            x2="0%"
                            y2="100%"
                        >
                            <stop
                                offset="0%"
                                stopColor="#1F4B32"
                                stopOpacity="0.28"
                            />
                            <stop
                                offset="100%"
                                stopColor="#1F4B32"
                                stopOpacity="0.01"
                            />
                        </linearGradient>
                    </defs>

                    {/* Hairline Grid lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                        const y =
                            padding.top +
                            ratio * (height - padding.top - padding.bottom);
                        const labelVal = maxValue - ratio * range;
                        return (
                            <g key={`grid-${idx}`}>
                                <line
                                    x1={padding.left}
                                    x2={width - padding.right}
                                    y1={y}
                                    y2={y}
                                    stroke="#E7E6E2"
                                    strokeDasharray="3 3"
                                />
                                <text
                                    x={padding.left - 8}
                                    y={y + 4}
                                    textAnchor="end"
                                    fontSize="10"
                                    fill="#A5A49E"
                                    className="font-sans"
                                >
                                    {formatNum(labelVal)}
                                </text>
                            </g>
                        );
                    })}

                    {/* Render Line or Bar Chart */}
                    {chartType === 'line' ? (
                        <>
                            {/* Area fill */}
                            <path d={areaPath} fill="url(#tarsiBrandGradient)" />

                            {/* Line */}
                            <path
                                d={linePath}
                                fill="none"
                                stroke="#1F4B32"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />

                            {/* Data points */}
                            {points.map((p, idx) => {
                                const isActive = activePointIndex === idx;
                                return (
                                    <g key={`point-${idx}`}>
                                        <circle
                                            cx={p.x}
                                            cy={p.y}
                                            r={isActive ? 6 : 4}
                                            fill={isActive ? '#1F4B32' : '#FFFFFF'}
                                            stroke="#1F4B32"
                                            strokeWidth="2.5"
                                            className="cursor-pointer transition-all duration-150"
                                            onMouseEnter={() =>
                                                setActivePointIndex(idx)
                                            }
                                        />
                                    </g>
                                );
                            })}
                        </>
                    ) : (
                        /* Bar Chart Mode */
                        <g>
                            {points.map((p, idx) => {
                                const barWidth = Math.min(
                                    36,
                                    (width - padding.left - padding.right) /
                                        (points.length * 1.6),
                                );
                                const barX = p.x - barWidth / 2;
                                const barY = p.y;
                                const barH = height - padding.bottom - p.y;
                                const isActive = activePointIndex === idx;

                                return (
                                    <rect
                                        key={`bar-${idx}`}
                                        x={barX}
                                        y={barY}
                                        width={barWidth}
                                        height={barH}
                                        rx={4}
                                        fill={isActive ? '#1F4B32' : '#2F6B3F'}
                                        opacity={isActive ? 1 : 0.8}
                                        className="cursor-pointer transition-all hover:opacity-100"
                                        onMouseEnter={() =>
                                            setActivePointIndex(idx)
                                        }
                                    />
                                );
                            })}
                        </g>
                    )}

                    {/* X Axis Labels */}
                    {points.map((p, idx) => (
                        <text
                            key={`x-label-${idx}`}
                            x={p.x}
                            y={height - padding.bottom + 22}
                            textAnchor="middle"
                            fontSize="11"
                            fontWeight="500"
                            fill={
                                activePointIndex === idx ? '#1F4B32' : '#6E6E68'
                            }
                            className="cursor-pointer font-sans"
                            onClick={() => setActivePointIndex(idx)}
                        >
                            {p.cropYear}
                        </text>
                    ))}
                </svg>
            </div>

            {/* Active Data Point Details Footer */}
            <div className="mt-3 rounded-[12px] bg-[#F2F1EE] p-3 flex flex-wrap items-center justify-between gap-3 text-xs text-[#1B1B18]">
                <div className="flex items-center gap-2">
                    <Info className="size-4 text-[#1F4B32]" />
                    <span>
                        {activeItem ? (
                            <>
                                <strong>Crop Year {activeItem.crop_year}:</strong>{' '}
                                {metricLabel} ={' '}
                                <span className="font-bold text-[#1F4B32]">
                                    {formatNum(
                                        Number(activeItem[metricKey] ?? 0),
                                    )}
                                </span>
                            </>
                        ) : (
                            'Hover over any data point on the chart to view detailed crop year values.'
                        )}
                    </span>
                </div>
                {activeItem && (
                    <div className="flex items-center gap-3 text-[11px] text-[#6E6E68]">
                        <span>Trucks: <strong>{activeItem.trucks}</strong></span>
                        <span>Gross CW: <strong>{formatNum(activeItem.gross_cw)}</strong></span>
                        <span>Net CW: <strong>{formatNum(activeItem.net_cw)}</strong></span>
                    </div>
                )}
            </div>
        </div>
    );
};
