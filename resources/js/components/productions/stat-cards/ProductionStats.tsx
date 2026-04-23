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
    const stats = [
        {
            title: 'Total Productions',
            value: Number(totalProductions).toFixed(0),
            icon: BookOpen,
            color: 'green',
        },
        // {
        //     title: 'Unique Planters',
        //     value: uniquePlanters,
        //     icon: User,
        //     color: 'blue',
        // },
        // {
        //     title: 'Total Gross CW',
        //     value: totalGross,
        //     icon: Clipboard,
        //     color: 'yellow',
        // },
        {
            title: 'Total Net CW',
            value: Number(totalNet).toFixed(2),
            icon: LandPlot,
            color: 'orange',
        },
        // {
        //     title: 'Total Theoretical LKG',
        //     value: totalTheoreticalLKG,
        //     icon: Clipboard,
        //     color: 'cyan',
        // },
        {
            title: 'Total Actual LKG',
            value: Number(totalActualLKG).toFixed(2),
            icon: Clipboard,
            color: 'teal',
        },
        {
            title: 'Total PSHR Net LKG',
            value: Number(totalPSHR).toFixed(2),
            icon: Clipboard,
            color: 'indigo',
        },
        // {
        //     title: 'Total PDPA LKG',
        //     value: totalPdpaLKG,
        //     icon: Clipboard,
        //     color: 'purple',
        // },
        // {
        //     title: 'Total Association Dues LKG',
        //     value: totalAssociationDuesLKG,
        //     icon: Clipboard,
        //     color: 'pink',
        // },
        {
            title: 'Total Actual MOL',
            value: Number(totalActualMOL).toFixed(2),
            icon: Clipboard,
            color: 'gray',
        },
        {
            title: 'Total PSHR Net MOL',
            value: Number(totalPSHRMOL).toFixed(2),
            icon: Clipboard,
            color: 'brown',
        },
        // {
        //     title: 'Total PDPA MOL',
        //     value: totalPdpaMOL,
        //     icon: Clipboard,
        //     color: 'lime',
        // },
        // {
        //     title: 'Total Association Dues MOL',
        //     value: totalAssociationDuesMOL,
        //     icon: Clipboard,
        //     color: 'amber',
        // },
    ];

    return (
        <>
            {stats.map((stat, index) => (
                <StatCard
                    key={index}
                    title={stat.title}
                    value={String(Number(stat.value))}
                    icon={stat.icon}
                    color={String(stat.color) as any}
                />
            ))}
        </>
    );
}
