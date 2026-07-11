import { CalendarDays, DollarSign, Layers, ShieldCheck } from 'lucide-react';
import { KpiCard } from '@/components/kpi/kpi-card';

export type MillingPeriodStatsData = {
    totalPeriods: number;
    activeNow: number;
    avgSugarPrice: number;
    avgMolPrice: number;
    avgSugarFactor?: number;
    cropYearsCount?: number;
};

function formatMoney(value: number): string {
    return Number(value ?? 0).toLocaleString(undefined, {
        style: 'currency',
        currency: 'PHP',
        maximumFractionDigits: 2,
    });
}

export default function MillingPeriodStats({
    stats,
}: {
    stats: MillingPeriodStatsData;
}) {
    return (
        <>
            <KpiCard
                title="Total Periods"
                value={stats.totalPeriods ?? 0}
                icon={CalendarDays}
                iconClassName="text-sky-600"
                valueClassName="text-sky-600"
            />
            <KpiCard
                title="Active Now"
                value={stats.activeNow ?? 0}
                icon={ShieldCheck}
                iconClassName="text-emerald-600"
                valueClassName="text-emerald-600"
            />
            <KpiCard
                title="Avg Sugar Price"
                value={formatMoney(stats.avgSugarPrice ?? 0)}
                icon={DollarSign}
                iconClassName="text-amber-600"
                valueClassName="text-amber-600"
            />
            <KpiCard
                title="Avg Molasses Price"
                value={formatMoney(stats.avgMolPrice ?? 0)}
                icon={DollarSign}
                iconClassName="text-orange-600"
                valueClassName="text-orange-600"
            />
            <KpiCard
                title="Crop Years"
                value={stats.cropYearsCount ?? 0}
                icon={Layers}
                iconClassName="text-violet-600"
                valueClassName="text-violet-600"
            />
        </>
    );
}
