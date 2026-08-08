import React from 'react';
import { cn } from '@/lib/utils';

interface DashedArcGaugeProps {
    value: number; // 0 to 100
    displayValue: string | number;
    title: string;
    subtitle?: string;
    statusLabel?: string;
    statusType?: 'positive' | 'warning' | 'negative' | 'neutral';
    minLabel?: string;
    maxLabel?: string;
    className?: string;
    ticksCount?: number;
}

/**
 * DashedArcGauge — Tarsi Signature Motif
 * Semi-circular gauge made of discrete rounded tick marks.
 * Green (#1F4B32) ticks for filled portion, light gray (#E3E2DE) for remainder.
 */
export const DashedArcGauge: React.FC<DashedArcGaugeProps> = ({
    value,
    displayValue,
    title,
    subtitle,
    statusLabel,
    statusType = 'positive',
    minLabel = '0%',
    maxLabel = '100%',
    className,
    ticksCount = 18,
}) => {
    const clampedValue = Math.min(100, Math.max(0, value));
    const filledTicksCount = Math.round((clampedValue / 100) * ticksCount);

    // Semi-circle from 180 deg to 0 deg
    const cx = 100;
    const cy = 82;
    const rInner = 56;
    const rOuter = 70;

    const ticks = Array.from({ length: ticksCount }, (_, i) => {
        const fraction = ticksCount === 1 ? 0 : i / (ticksCount - 1);
        // Angle in radians: 180deg (left) to 0deg (right) -> PI to 0
        const angle = Math.PI - fraction * Math.PI;

        const x1 = cx + rInner * Math.cos(angle);
        const y1 = cy - rInner * Math.sin(angle);
        const x2 = cx + rOuter * Math.cos(angle);
        const y2 = cy - rOuter * Math.sin(angle);

        const isFilled = i < filledTicksCount;

        return {
            id: i,
            x1,
            y1,
            x2,
            y2,
            isFilled,
        };
    });

    return (
        <div
            className={cn(
                'flex flex-col justify-between rounded-[18px] border border-[#E7E6E2] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all hover:border-[#1F4B32]/30',
                className,
            )}
        >
            {/* Top header row */}
            <div className="flex items-start justify-between gap-2">
                <div>
                    <h3 className="text-[15px] font-semibold text-[#1B1B18] leading-tight">
                        {title}
                    </h3>
                    {subtitle && (
                        <p className="mt-0.5 text-xs text-[#6E6E68]">
                            {subtitle}
                        </p>
                    )}
                </div>
                {statusLabel && (
                    <TarsiStatusBadge
                        label={statusLabel}
                        type={statusType}
                    />
                )}
            </div>

            {/* Arc Gauge Container */}
            <div className="relative my-2 flex flex-col items-center justify-center">
                <svg
                    viewBox="0 0 200 110"
                    className="h-28 w-full max-w-[200px]"
                >
                    {ticks.map((tick) => (
                        <line
                            key={tick.id}
                            x1={tick.x1}
                            y1={tick.y1}
                            x2={tick.x2}
                            y2={tick.y2}
                            stroke={tick.isFilled ? '#1F4B32' : '#E3E2DE'}
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            className="transition-colors duration-300"
                        />
                    ))}
                </svg>

                {/* Big centered metric under arc */}
                <div className="absolute top-[52%] flex flex-col items-center text-center">
                    <span className="text-2xl font-bold tracking-tight text-[#1B1B18] font-sans">
                        {displayValue}
                    </span>
                </div>

                {/* Min / Max axis labels at bottom corners */}
                <div className="mt-[-10px] flex w-full justify-between px-3 text-[11px] font-medium text-[#A5A49E]">
                    <span>{minLabel}</span>
                    <span>{maxLabel}</span>
                </div>
            </div>
        </div>
    );
};

interface SegmentedProgressBarProps {
    value: number; // 0 to 100
    segments?: number;
    showPercent?: boolean;
    className?: string;
    barHeight?: string;
}

/**
 * SegmentedProgressBar — Tarsi Signature Motif
 * Row of small rounded rectangles filled in brand green (#1F4B32).
 */
export const SegmentedProgressBar: React.FC<SegmentedProgressBarProps> = ({
    value,
    segments = 20,
    showPercent = true,
    className,
    barHeight = 'h-2.5',
}) => {
    const clamped = Math.min(100, Math.max(0, value));
    const filledCount = Math.round((clamped / 100) * segments);

    return (
        <div className={cn('w-full', className)}>
            <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-[12px] font-medium text-[#6E6E68]">
                    Progress
                </span>
                {showPercent && (
                    <span className="text-[12px] font-bold text-[#1B1B18]">
                        {Math.round(clamped)}%
                    </span>
                )}
            </div>
            <div className={cn('flex gap-1 w-full', barHeight)}>
                {Array.from({ length: segments }, (_, idx) => {
                    const isFilled = idx < filledCount;
                    return (
                        <div
                            key={idx}
                            className={cn(
                                'flex-1 rounded-[3px] transition-colors duration-200',
                                isFilled ? 'bg-[#1F4B32]' : 'bg-[#E3E2DE]',
                            )}
                        />
                    );
                })}
            </div>
        </div>
    );
};

interface VerticalBarCombProps {
    value: number;
    total?: number;
    barsCount?: number;
    className?: string;
}

/**
 * VerticalBarComb — Tarsi Signature Motif
 * Vertical thin ticks representing discrete metric density.
 */
export const VerticalBarComb: React.FC<VerticalBarCombProps> = ({
    value,
    total = 100,
    barsCount = 24,
    className,
}) => {
    const clamped = Math.min(total, Math.max(0, value));
    const filledCount = Math.round((clamped / Math.max(total, 1)) * barsCount);

    return (
        <div className={cn('flex items-end gap-1 h-6 w-full', className)}>
            {Array.from({ length: barsCount }, (_, idx) => {
                const isFilled = idx < filledCount;
                return (
                    <div
                        key={idx}
                        className={cn(
                            'flex-1 rounded-t-[2px] transition-all duration-300',
                            isFilled ? 'bg-[#1F4B32]' : 'bg-[#E3E2DE]',
                        )}
                        style={{
                            height: `${40 + (idx % 5) * 12}%`,
                        }}
                    />
                );
            })}
        </div>
    );
};

interface TarsiStatusBadgeProps {
    label: string;
    type?: 'positive' | 'warning' | 'negative' | 'neutral';
    showDot?: boolean;
    className?: string;
}

/**
 * TarsiStatusBadge — Pill badge with low-opacity soft background and semantic colored text/dot.
 */
export const TarsiStatusBadge: React.FC<TarsiStatusBadgeProps> = ({
    label,
    type = 'positive',
    showDot = true,
    className,
}) => {
    const styles = {
        positive: 'bg-[#E7F0E5] text-[#2F6B3F] border-[#CDE0C9]',
        warning: 'bg-[#FBEEDF] text-[#C97A2B] border-[#F5D8B8]',
        negative: 'bg-[#FBEAE5] text-[#B3492E] border-[#F6C6BA]',
        neutral: 'bg-[#F2F1EE] text-[#6E6E68] border-[#E7E6E2]',
    };

    const dotColors = {
        positive: 'bg-[#2F6B3F]',
        warning: 'bg-[#C97A2B]',
        negative: 'bg-[#B3492E]',
        neutral: 'bg-[#6E6E68]',
    };

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-tight transition-colors',
                styles[type],
                className,
            )}
        >
            {showDot && (
                <span
                    className={cn(
                        'size-1.5 rounded-full shrink-0',
                        dotColors[type],
                    )}
                />
            )}
            {label}
        </span>
    );
};
