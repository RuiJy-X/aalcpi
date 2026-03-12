import { BookOpen, LandPlot, User } from 'lucide-react';
import React from 'react';
import type {
    PlanterRow,
    ProductionRow,
    CertificationRow,
    LandRow,
} from '@/components/planters/planters-table-types';
import StatCard from '@/components/stat-card';

export default function PlanterStats({
    planters,
    productions,
    certifications,
    lands,
}: {
    planters: PlanterRow[];
    productions: ProductionRow[];
    certifications: CertificationRow[];
    lands: LandRow[];
}) {
    const totalPlanters = planters.length;

    const totalLands = lands.length;
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
                title="Total Lands"
                value={String(totalLands)}
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
