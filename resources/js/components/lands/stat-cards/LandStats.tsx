import React from 'react';
import { LandPlot, User, BookOpen, ShieldCheck } from 'lucide-react';
import StatCard from '@/components/stat-card';
import type {
    LandRow,
    PlanterRow,
} from '@/components/planters/planters-table-types';

export default function LandStats({ lands }: { lands: LandRow[] }) {
    const totalLands = lands.length;
    const totalArea = lands.reduce(
        (s, l) => s + Number(l.area_hectares || 0),
        0,
    );
    const uniquePlanters = new Set(lands.map((l) => l.planter_id)).size;
    const activeLands = lands.filter((l) => l.is_active).length;

    return (
        <>
            <StatCard
                title="Total Lands"
                value={String(totalLands)}
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
                title="Active Lands"
                value={String(activeLands)}
                icon={ShieldCheck}
                color="orange"
            />
        </>
    );
}
