import React from 'react';

interface Props {
    title: string;
    value: string;
    subtitle?: string;
    icon: React.ElementType;
    color?:
        | 'red'
        | 'yellow'
        | 'orange'
        | 'green'
        | 'blue'
        | 'cyan'
        | 'teal'
        | 'indigo'
        | 'purple'
        | 'pink'
        | 'gray'
        | 'brown'
        | 'lime'
        | 'amber';
}

const colorTokens: Record<
    NonNullable<Props['color']>,
    {
        accent: string;
        badgeBg: string;
        iconColor: string;
    }
> = {
    blue: {
        accent: '#378ADD',
        badgeBg: 'bg-blue-50',
        iconColor: 'text-blue-700',
    },
    teal: {
        accent: '#1D9E75',
        badgeBg: 'bg-teal-50',
        iconColor: 'text-teal-700',
    },
    green: {
        accent: '#639922',
        badgeBg: 'bg-green-50',
        iconColor: 'text-green-700',
    },
    purple: {
        accent: '#7F77DD',
        badgeBg: 'bg-violet-50',
        iconColor: 'text-violet-700',
    },
    indigo: {
        accent: '#4F46E5',
        badgeBg: 'bg-indigo-50',
        iconColor: 'text-indigo-700',
    },
    amber: {
        accent: '#BA7517',
        badgeBg: 'bg-amber-50',
        iconColor: 'text-amber-700',
    },
    orange: {
        accent: '#EA580C',
        badgeBg: 'bg-orange-50',
        iconColor: 'text-orange-700',
    },
    yellow: {
        accent: '#CA8A04',
        badgeBg: 'bg-yellow-50',
        iconColor: 'text-yellow-700',
    },
    red: { accent: '#E24B4A', badgeBg: 'bg-red-50', iconColor: 'text-red-700' },
    pink: {
        accent: '#D4537E',
        badgeBg: 'bg-pink-50',
        iconColor: 'text-pink-700',
    },
    cyan: {
        accent: '#0891B2',
        badgeBg: 'bg-cyan-50',
        iconColor: 'text-cyan-700',
    },
    gray: {
        accent: '#888780',
        badgeBg: 'bg-gray-100',
        iconColor: 'text-gray-600',
    },
    lime: {
        accent: '#65A30D',
        badgeBg: 'bg-lime-50',
        iconColor: 'text-lime-700',
    },
    brown: {
        accent: '#92400E',
        badgeBg: 'bg-amber-100',
        iconColor: 'text-amber-900',
    },
};

const StatCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    color = 'blue',
}: Props) => {
    const { accent, badgeBg, iconColor } = colorTokens[color];

    const formatValue = (val: string) => {
        const trimmed = val.replace(/,/g, '').trim();
        if (trimmed.length <= 6) return val;
        const numeric = Number(trimmed);
        if (!Number.isFinite(numeric)) return val;
        const abs = Math.abs(numeric);
        if (abs >= 1_000_000_000)
            return `${(numeric / 1_000_000_000).toFixed(1)}B`;
        if (abs >= 1_000_000) return `${(numeric / 1_000_000).toFixed(1)}M`;
        if (abs >= 1_000) return `${(numeric / 1_000).toFixed(1)}K`;
        return val;
    };

    return (
        <div
            className="h-32 min-w-[300px] flex-[1_1_300px] rounded-[10px] border border-gray-100 bg-white px-5 py-4 shadow-md"
            style={{ borderLeft: `3px solid ${accent}` }}
        >
            {/* Header row */}
            <div className="mb-3 flex items-start justify-between">
                <span className="text-[11px] leading-none font-medium tracking-[0.07em] text-gray-400 uppercase">
                    {title}
                </span>
                <span
                    className={`flex h-7 w-7 items-center justify-center rounded-md ${badgeBg}`}
                >
                    <Icon size={32} strokeWidth={2.5} className={iconColor} />
                </span>
            </div>

            {/* Value */}
            <div
                className="text-dark mb-1 truncate text-4xl font-bold tracking-tight"
                title={value}
            >
                {formatValue(value)}
            </div>

            {/* Optional subtitle */}
            {subtitle && (
                <p className="text-dark mt-1.5 text-[11px] tracking-wide">
                    {subtitle}
                </p>
            )}
        </div>
    );
};

export default StatCard;
