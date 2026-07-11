import {
    BookOpen,
    Clipboard,
    DollarSign,
    LandPlot,
    Truck,
    User,
} from 'lucide-react';
import { KpiCard } from '@/components/kpi/kpi-card';

export type ProductionStatsData = {
    totalProductions: number;
    totalNetCw: number;
    totalActualLkg: number;
    totalPshrNetLkg: number;
    totalActualMol: number;
    totalPshrNetMol: number;
    totalTrucks?: number;
    uniquePlanters?: number;
    totalPlanterLkgMoney?: number;
    totalPlanterMolMoney?: number;
};

function formatNumber(value: number, digits = 2): string {
    return Number(value ?? 0).toLocaleString(undefined, {
        maximumFractionDigits: digits,
        minimumFractionDigits: 0,
    });
}

function formatMoney(value: number): string {
    return Number(value ?? 0).toLocaleString(undefined, {
        style: 'currency',
        currency: 'PHP',
        maximumFractionDigits: 0,
    });
}

export default function ProductionStats({
    stats,
}: {
    stats: ProductionStatsData;
}) {
    const totalMoney =
        Number(stats.totalPlanterLkgMoney ?? 0) +
        Number(stats.totalPlanterMolMoney ?? 0);

    return (
        <>
            <KpiCard
                title="Total Productions"
                value={formatNumber(stats.totalProductions ?? 0, 0)}
                icon={BookOpen}
                iconClassName="text-emerald-600"
                valueClassName="text-emerald-600"
            />
            <KpiCard
                title="Total Net CW"
                value={formatNumber(stats.totalNetCw ?? 0)}
                icon={LandPlot}
                iconClassName="text-orange-600"
                valueClassName="text-orange-600"
            />
            <KpiCard
                title="Actual LKG"
                value={formatNumber(stats.totalActualLkg ?? 0)}
                icon={Clipboard}
                iconClassName="text-teal-600"
                valueClassName="text-teal-600"
            />
            <KpiCard
                title="PSHR Net LKG"
                value={formatNumber(stats.totalPshrNetLkg ?? 0)}
                icon={Clipboard}
                iconClassName="text-indigo-600"
                valueClassName="text-indigo-600"
            />
            <KpiCard
                title="Actual MOL"
                value={formatNumber(stats.totalActualMol ?? 0)}
                icon={Clipboard}
                iconClassName="text-slate-600"
                valueClassName="text-slate-700"
            />
            <KpiCard
                title="Trucks"
                value={formatNumber(stats.totalTrucks ?? 0, 0)}
                icon={Truck}
                iconClassName="text-sky-600"
                valueClassName="text-sky-600"
            />
            <KpiCard
                title="Planters"
                value={formatNumber(stats.uniquePlanters ?? 0, 0)}
                icon={User}
                iconClassName="text-violet-600"
                valueClassName="text-violet-600"
            />
            <KpiCard
                title="Planter Share Value"
                value={formatMoney(totalMoney)}
                icon={DollarSign}
                iconClassName="text-amber-600"
                valueClassName="text-amber-600"
            />
        </>
    );
}
