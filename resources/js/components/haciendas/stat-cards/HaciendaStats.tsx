import React from 'react';
import { LandPlot, User, BookOpen, ShieldCheck } from 'lucide-react';
import StatCard from '@/components/stat-card';
import type {
    HaciendaRow,
    PlanterRow,
} from '@/components/planters/planters-table-types';

export default function HaciendaStats({
    haciendas,
}: {
    haciendas: HaciendaRow[];
}) {
    const totalHaciendas = haciendas.length;
    const totalArea = haciendas.reduce(
        (s, l) => s + Number(l.area_hectares || 0),
        0,
    );
    const uniquePlanters = new Set(haciendas.map((l) => l.planter_id)).size;
    const activeHaciendas = haciendas.filter((l) => l.is_active).length;

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
