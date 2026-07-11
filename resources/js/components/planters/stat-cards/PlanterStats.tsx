import { BookOpen, LandPlot, User, Users } from 'lucide-react';
import { KpiCard } from '@/components/kpi/kpi-card';

export type PlanterStatsData = {
    totalPlanters: number;
    totalHaciendas: number;
    totalProductions: number;
    plantersWithHaciendas?: number;
};

export default function PlanterStats({ stats }: { stats: PlanterStatsData }) {
    return (
        <>
            <KpiCard
                title="Total Planters"
                value={stats.totalPlanters ?? 0}
                icon={User}
                iconClassName="text-emerald-600"
                valueClassName="text-emerald-600"
            />
            <KpiCard
                title="With Haciendas"
                value={stats.plantersWithHaciendas ?? 0}
                icon={Users}
                iconClassName="text-sky-600"
                valueClassName="text-sky-600"
            />
            <KpiCard
                title="Total Haciendas"
                value={stats.totalHaciendas ?? 0}
                icon={LandPlot}
                iconClassName="text-orange-600"
                valueClassName="text-orange-600"
            />
            <KpiCard
                title="Total Productions"
                value={stats.totalProductions ?? 0}
                icon={BookOpen}
                iconClassName="text-amber-600"
                valueClassName="text-amber-600"
            />
        </>
    );
}
