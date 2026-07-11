import { CalendarDays, FileText, User, Layers } from 'lucide-react';
import { KpiCard } from '@/components/kpi/kpi-card';

export type WeeklyStatsData = {
    totalDocuments: number;
    uniquePlanters: number;
    uniqueWeeks: number;
    uniqueCropYears: number;
};

export default function WeeklyStats({ stats }: { stats: WeeklyStatsData }) {
    return (
        <>
            <KpiCard
                title="Total Documents"
                value={stats.totalDocuments ?? 0}
                icon={FileText}
                iconClassName="text-sky-600"
                valueClassName="text-sky-600"
            />
            <KpiCard
                title="Unique Planters"
                value={stats.uniquePlanters ?? 0}
                icon={User}
                iconClassName="text-emerald-600"
                valueClassName="text-emerald-600"
            />
            <KpiCard
                title="Weeks Covered"
                value={stats.uniqueWeeks ?? 0}
                icon={CalendarDays}
                iconClassName="text-orange-600"
                valueClassName="text-orange-600"
            />
            <KpiCard
                title="Crop Years"
                value={stats.uniqueCropYears ?? 0}
                icon={Layers}
                iconClassName="text-violet-600"
                valueClassName="text-violet-600"
            />
        </>
    );
}
