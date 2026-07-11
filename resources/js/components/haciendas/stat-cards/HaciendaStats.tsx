import { LandPlot, User, BookOpen, ShieldCheck } from 'lucide-react';
import { KpiCard } from '@/components/kpi/kpi-card';

export type HaciendaStatsData = {
    totalHaciendas: number;
    totalArea: number;
    uniquePlanters: number;
    activeHaciendas: number;
};

export default function HaciendaStats({
    stats,
}: {
    stats: HaciendaStatsData;
}) {
    return (
        <>
            <KpiCard
                title="Total Haciendas"
                value={stats.totalHaciendas ?? 0}
                icon={LandPlot}
                iconClassName="text-emerald-600"
                valueClassName="text-emerald-600"
            />
            <KpiCard
                title="Total Area (ha)"
                value={Number(stats.totalArea ?? 0).toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                })}
                icon={BookOpen}
                iconClassName="text-amber-600"
                valueClassName="text-amber-600"
            />
            <KpiCard
                title="Unique Planters"
                value={stats.uniquePlanters ?? 0}
                icon={User}
                iconClassName="text-sky-600"
                valueClassName="text-sky-600"
            />
            <KpiCard
                title="Active Haciendas"
                value={stats.activeHaciendas ?? 0}
                icon={ShieldCheck}
                iconClassName="text-orange-600"
                valueClassName="text-orange-600"
            />
        </>
    );
}
