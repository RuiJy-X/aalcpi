import React from 'react';
import { LandPlot, User, BookOpen, ShieldCheck } from 'lucide-react';
import StatCard from '@/components/stat-card';

export default function HaciendaStats({
    stats,
}: {
    stats: {
        totalHaciendas: number;
        totalArea: number;
        uniquePlanters: number;
        activeHaciendas: number;
    };
}) {
    const totalHaciendas = stats.totalHaciendas;
    const totalArea = stats.totalArea;
    const uniquePlanters = stats.uniquePlanters;
    const activeHaciendas = stats.activeHaciendas;

    return (
        <>
            <StatCard
                title="Total Haciendas"
                value={String(totalHaciendas)}
                icon={LandPlot}
                color="green"
            />

            <StatCard
                title="Total Area (ha)"
                value={String(totalArea)}
                icon={BookOpen}
                color="yellow"
            />

            <StatCard
                title="Unique Planters"
                value={String(uniquePlanters)}
                icon={User}
                color="blue"
            />

            <StatCard
                title="Active Haciendas"
                value={String(activeHaciendas)}
                icon={ShieldCheck}
                color="orange"
            />
        </>
    );
}
