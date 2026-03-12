import { BookOpen, User, Clipboard, LandPlot } from 'lucide-react';
import React from 'react';
import type {
    ProductionRow,
    PlanterRow,
} from '@/components/planters/planters-table-types';
import StatCard from '@/components/stat-card';

export default function ProductionStats({
    productions,
    planters,
}: {
    productions: ProductionRow[];
    planters?: PlanterRow[];
}) {
    const totalProductions = productions.length;
    const totalGross = productions.reduce(
        (s, p) => s + Number(p.gross_cw || 0),
        0,
    );
    const totalNet = productions.reduce((s, p) => s + Number(p.net_cw || 0), 0);
    const uniquePlanters = new Set(productions.map((p) => p.planter_id)).size;
    const totalTheoreticalLKG = productions.reduce(
        (acc, val) => acc + Number(val.theoretical_lkg || 0),
        0,
    );
    const totalActualLKG = productions.reduce(
        (acc, val) => acc + Number(val.actual_lkg || 0),
        0,
    );
    const totalPSHR = productions.reduce(
        (acc, val) => acc + Number(val.pshr_net_lkg || 0),
        0,
    );

    const totalPdpaLKG = productions.reduce(
        (acc, val) => acc + Number(val.pdpa_lkg),
        0,
    );
    const totalAssociationDuesLKG = productions.reduce(
        (acc, val) => acc + Number(val.association_dues_lkg),
        0,
    );
    const totalActualMOL = productions.reduce(
        (acc, val) => acc + Number(val.actual_mol || 0),
        0,
    );
    const totalPSHRMOL = productions.reduce(
        (acc, val) => acc + Number(val.pshr_net_mol || 0),
        0,
    );
    const totalPdpaMOL = productions.reduce(
        (acc, val) => acc + Number(val.pdpa_mol || 0),
        0,
    );
    const totalAssociationDuesMOL = productions.reduce(
        (acc, val) => acc + Number(val.association_dues_mol || 0),
        0,
    );

    return (
        <>
            <StatCard
                title="Total Productions"
                value={String(totalProductions)}
                icon={BookOpen}
                color="green"
            />

            <StatCard
                title="Unique Planters"
                value={String(uniquePlanters)}
                icon={User}
                color="blue"
            />

            <StatCard
                title="Total Gross CW"
                value={String(totalGross)}
                icon={Clipboard}
                color="yellow"
            />

            <StatCard
                title="Total Net CW"
                value={String(totalNet)}
                icon={LandPlot}
                color="orange"
            />

            <StatCard
                title="Total Theoretical LKG"
                value={String(totalTheoreticalLKG)}
                icon={Clipboard}
                color="cyan"
            />

            <StatCard
                title="Total Actual LKG"
                value={String(totalActualLKG)}
                icon={Clipboard}
                color="teal"
            />

            <StatCard
                title="Total PSHR Net LKG"
                value={String(totalPSHR)}
                icon={Clipboard}
                color="indigo"
            />

            <StatCard
                title="Total PDPA LKG"
                value={String(totalPdpaLKG)}
                icon={Clipboard}
                color="purple"
            />

            <StatCard
                title="Total Association Dues LKG"
                value={String(totalAssociationDuesLKG)}
                icon={Clipboard}
                color="pink"
            />

            <StatCard
                title="Total Actual MOL"
                value={String(totalActualMOL)}
                icon={Clipboard}
                color="gray"
            />

            <StatCard
                title="Total PSHR Net MOL"
                value={String(totalPSHRMOL)}
                icon={Clipboard}
                color="brown"
            />

            <StatCard
                title="Total PDPA MOL"
                value={String(totalPdpaMOL)}
                icon={Clipboard}
                color="lime"
            />

            <StatCard
                title="Total Association Dues MOL"
                value={String(totalAssociationDuesMOL)}
                icon={Clipboard}
                color="amber"
            />
        </>
    );
}
