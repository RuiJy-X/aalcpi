import React from 'react';
interface Props {
    title: string;
    value: string;
    icon: React.ElementType;
    color?: 'red' | 'yellow' | 'orange' | 'green' | 'blue';
}

const StatCard = (props: Props) => {
    const colorClassMap: Record<NonNullable<Props['color']>, string> = {
        red: 'bg-red-100',
        yellow: 'bg-yellow-100',
        orange: 'bg-orange-100',
        green: 'bg-green-100',
        blue: 'bg-sky-100',
    };

    const bgClass = props.color
        ? colorClassMap[props.color]
        : 'bg-[color:var(--secondary-color)]';

    const formatValue = (value: string) => {
        const trimmed = value.replace(/,/g, '').trim();
        if (trimmed.length <= 6) return value;
        const numeric = Number(trimmed);
        if (!Number.isFinite(numeric)) return value;
        const abs = Math.abs(numeric);

        if (abs >= 1_000_000_000)
            return `${(numeric / 1_000_000_000).toFixed(1)}B`;
        if (abs >= 1_000_000) return `${(numeric / 1_000_000).toFixed(1)}M`;
        if (abs >= 1_000) return `${(numeric / 1_000).toFixed(1)}K`;
        return value;
    };

    return (
        <div
            className={`p-4 ${bgClass} w-64 rounded-md border-gray-100 shadow`}
        >
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <div className="stat-title mb-3 text-sm text-gray-600">
                        {props.title}
                    </div>
                    <div
                        className="stat-value text-3xl font-bold text-[color:var(--dark-color)]"
                        title={props.value}
                    >
                        {formatValue(props.value)}
                    </div>
                </div>

                <div className="self-center p-3 align-middle text-[color:var(--brand-primary)]">
                    <props.icon size={30} strokeWidth={2.5} />
                </div>
            </div>
        </div>
    );
};

export default StatCard;
