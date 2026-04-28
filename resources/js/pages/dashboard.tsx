import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import HaciendaStats from '@/components/haciendas/stat-cards/HaciendaStats';
import PlanterStats from '@/components/planters/stat-cards/PlanterStats';
import ProductionStats from '@/components/productions/stat-cards/ProductionStats';
import type { ProductionRow } from '@/components/planters/planters-table-types';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

export default function Dashboard({
    planter_stats,
    hacienda_stats,
    production_stats,
}: {
    planter_stats: {
        totalPlanters: number;
        totalHaciendas: number;
        totalProductions: number;
    };
    hacienda_stats: {
        totalHaciendas: number;
        totalArea: number;
        uniquePlanters: number;
        activeHaciendas: number;
    };
    production_stats: {
        totalProductions: number;
        totalNetCw: number;
        totalActualLkg: number;
        totalPshrNetLkg: number;
        totalActualMol: number;
        totalPshrNetMol: number;
    };
}) {
    const emptyProductions: ProductionRow[] = [];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard"></Head>

            <section className="px-3 pt-3">
                <h2 className="text-lg font-semibold text-gray-900">
                    Planters Overview
                </h2>
                <div className="mt-3 flex flex-wrap gap-2">
                    <PlanterStats stats={planter_stats} />
                </div>
            </section>

            <section className="px-3 pt-6">
                <h2 className="text-lg font-semibold text-gray-900">
                    Haciendas Overview
                </h2>
                <div className="mt-3 flex flex-wrap gap-2">
                    <HaciendaStats stats={hacienda_stats} />
                </div>
            </section>

            <section className="px-3 pt-6 pb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                    Productions Overview
                </h2>
                <div className="mt-3 flex flex-wrap gap-2">
                    <ProductionStats
                        productions={emptyProductions}
                        stats={production_stats}
                    />
                </div>
            </section>
        </AppLayout>
    );
}
