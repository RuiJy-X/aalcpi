import { BookOpen, LandPlot, User } from 'lucide-react';
import React from 'react';
import type {
    PlanterRow,
    ProductionRow,
    CertificationRow,
    HaciendaRow,
} from '@/components/planters/planters-table-types';
import StatCard from '@/components/stat-card';

export default function PlanterStats({
    planters,
    productions,
    certifications,
    haciendas,
}: {
    planters: PlanterRow[];
    productions: ProductionRow[];
    certifications: CertificationRow[];
    haciendas: HaciendaRow[];
}) {
    const totalPlanters = planters.length;

    const totalHaciendas = haciendas.length;
    const totalProductions = productions.length;

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
