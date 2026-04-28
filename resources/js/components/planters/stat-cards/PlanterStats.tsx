import { BookOpen, LandPlot, User } from 'lucide-react';
import React from 'react';
import StatCard from '@/components/stat-card';

export default function PlanterStats({
    stats,
}: {
    stats: {
        totalPlanters: number;
        totalHaciendas: number;
        totalProductions: number;
    };
}) {
    const totalPlanters = stats.totalPlanters;
    const totalHaciendas = stats.totalHaciendas;
    const totalProductions = stats.totalProductions;

    return (
        <>
            <StatCard
                title="Total Planters"
                value={String(totalPlanters)}
                icon={User}
                color="green"
            />

            <StatCard
                title="Total Haciendas"
                value={String(totalHaciendas)}
                icon={LandPlot}
                color="orange"
            />

            <StatCard
                title="Total Productions"
                value={String(totalProductions)}
                icon={BookOpen}
                color="yellow"
            />
        </>
    );
}
