import React from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { create as millingPeriodCreate } from '@/routes/milling-periods';
import { useCan } from '@/hooks/use-can';

// Import Clean Dashboard Components
import { DashboardActionBanner, ActionQueueItem } from '@/components/dashboard/dashboard-action-banner';
import { ImportDataDropdown } from '@/components/dashboard/import-data-dropdown';
import { MinimalKpiStrip } from '@/components/dashboard/minimal-kpi-strip';
import {
    ProductionWorkflowData,
} from '@/components/dashboard/production-workflow-card';
import {
    BankReconWorkflowData,
} from '@/components/dashboard/recon-workflow-card';
import {
    PayrollWorkflowData,
} from '@/components/dashboard/payroll-workflow-card';
import {
    CompactMillingPreview,
    MillingPeriodItem,
} from '@/components/dashboard/compact-milling-preview';
import {
    ProductionTrendChart,
    TrendItem,
} from '@/components/dashboard/production-trend-chart';
import {
    PlanterLeaderboard,
    PlanterLeaderboardItem,
} from '@/components/dashboard/planter-leaderboard';
import {
    LiveIngestionStream,
    RecentActivityItem,
} from '@/components/dashboard/live-ingestion-stream';
import {
    ModuleSummaryItem,
} from '@/components/dashboard/dashboard-module-directory';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

interface DashboardProps {
    crop_years: string[];
    filters: {
        crop_year?: string | null;
    };
    kpi_totals?: any;
    entity_counts?: {
        planters: number;
        haciendas: number;
    };
    trend_data?: TrendItem[];
    leaderboard?: PlanterLeaderboardItem[];
    milling_periods?: MillingPeriodItem[];
    production_workflow?: ProductionWorkflowData;
    bank_recon_workflow?: BankReconWorkflowData;
    payroll_workflow?: PayrollWorkflowData;
    active_milling_period?: MillingPeriodItem | null;
    action_queue?: ActionQueueItem[];
    module_summaries?: ModuleSummaryItem[];
    status_tracking?: any;
    recent_activity?: RecentActivityItem[];
}

export default function Dashboard({
    crop_years = [],
    filters,
    trend_data = [],
    leaderboard = [],
    milling_periods = [],
    production_workflow,
    bank_recon_workflow,
    payroll_workflow,
    active_milling_period = null,
    action_queue = [],
    recent_activity = [],
}: DashboardProps) {
    const { can, canAny } = useCan();
    const selectedCropYear = filters?.crop_year ?? (crop_years[0] || '');

    const applyCropYear = (cropYear: string) => {
        const query: Record<string, string> = {};
        if (cropYear) {
            query.crop_year = cropYear;
        }
        router.get(dashboard().url, query, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const prodWorkflow: ProductionWorkflowData = production_workflow ?? {
        total_rows: 0,
        draft_count: 0,
        completed_count: 0,
        percent_complete: 0,
        gross_cw: 0,
        net_cw: 0,
        trucks: 0,
        actual_lkg: 0,
        pshr_net_lkg: 0,
        mill_share_lkg: 0,
        actual_mol: 0,
        pshr_net_mol: 0,
        mill_share_mol: 0,
    };

    const reconWorkflow: BankReconWorkflowData = bank_recon_workflow ?? {
        total: 0,
        matched_count: 0,
        match_rate: 0,
        outstanding_count: 0,
        outstanding_amount: 0,
        unrecorded_count: 0,
        unrecorded_amount: 0,
        mismatch_count: 0,
    };

    const payWorkflow: PayrollWorkflowData = payroll_workflow ?? {
        total_count: 0,
        draft_count: 0,
        draft_amount: 0,
        pending_count: 0,
        pending_amount: 0,
        paid_count: 0,
        paid_amount: 0,
        attendance_this_month: 0,
        active_advance_balance: 0,
    };

    const canViewProductions = can('productions.view') || can('planters.view');
    const canViewMilling = can('milling_periods.view');
    const canViewImports = canAny([
        'import_history.view',
        'weekly.create',
        'productions.import',
        'attendance.import',
        'bank_reconciliation.create',
    ]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div className="space-y-4 sm:space-y-5 pb-10 font-sans text-slate-900 w-full max-w-full overflow-hidden">
                {/* 1. Header & Controls */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between min-w-0">
                    <div className="min-w-0">
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight truncate">
                            Operations Dashboard
                        </h1>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                            {selectedCropYear === 'all'
                                ? 'All crop years combined overview'
                                : selectedCropYear
                                  ? `Crop Year ${selectedCropYear} overview`
                                  : 'Active operations overview'}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {/* Crop Year Selector */}
                        <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs shadow-2xs">
                            <span className="font-semibold text-slate-500 text-[11px]">Year</span>
                            <Select
                                value={selectedCropYear ?? 'all'}
                                onValueChange={applyCropYear}
                            >
                                <SelectTrigger className="w-28 border-none bg-transparent font-bold text-slate-900 focus:ring-0 text-xs h-6 p-0">
                                    <SelectValue placeholder="Year" />
                                </SelectTrigger>
                                <SelectContent className="bg-white rounded-lg shadow-lg border-slate-200">
                                    <SelectItem value="all">
                                        All Years
                                    </SelectItem>
                                    {crop_years.map((cy) => (
                                        <SelectItem key={cy} value={cy}>
                                            {cy}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Multi-Module Import Menu */}
                        <ImportDataDropdown />

                        {/* Add Milling Week */}
                        {can('milling_periods.create') && (
                            <Button
                                size="sm"
                                onClick={() => router.get(millingPeriodCreate().url)}
                                className="bg-emerald-700 hover:bg-emerald-800 text-white font-medium shadow-2xs rounded-lg text-xs h-8"
                            >
                                <Plus className="mr-1 size-3.5" />
                                Milling Week
                            </Button>
                        )}
                    </div>
                </div>

                {/* 2. Urgent Action Alert (Minimal 1-line inline bar) */}
                <DashboardActionBanner items={action_queue} />

                {/* 3. Minimal 4-Tile Stat Strip */}
                <MinimalKpiStrip
                    production={prodWorkflow}
                    recon={reconWorkflow}
                    payroll={payWorkflow}
                />

                {/* 4. Core Analytics & Milling Widget (7 / 5 Grid) */}
                <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-12 w-full min-w-0">
                    {/* Left 7 cols: Production Trend Curve */}
                    {canViewProductions && (
                        <div className={canViewMilling ? 'lg:col-span-7 min-w-0' : 'col-span-full min-w-0'}>
                            <ProductionTrendChart
                                data={trend_data}
                                selectedCropYear={selectedCropYear}
                            />
                        </div>
                    )}

                    {/* Right 5 cols: Compact Milling Period Widget */}
                    {canViewMilling && (
                        <div className={canViewProductions ? 'lg:col-span-5 min-w-0' : 'col-span-full min-w-0'}>
                            <CompactMillingPreview
                                activePeriod={active_milling_period}
                                periods={milling_periods}
                                selectedCropYear={selectedCropYear}
                            />
                        </div>
                    )}
                </div>

                {/* 5. Planter Leaderboard & Live Ingestion Stream (7 / 5 Grid) */}
                <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-12 w-full min-w-0">
                    {/* Left 7 cols: Planters Delivery Leaderboard */}
                    {canViewProductions && (
                        <div className={canViewImports ? 'lg:col-span-7 min-w-0' : 'col-span-full min-w-0'}>
                            <PlanterLeaderboard
                                leaderboard={leaderboard}
                                selectedCropYear={selectedCropYear}
                            />
                        </div>
                    )}

                    {/* Right 5 cols: Live Ingestion Activity Stream */}
                    {canViewImports && (
                        <div className={canViewProductions ? 'lg:col-span-5 min-w-0' : 'col-span-full min-w-0'}>
                            <LiveIngestionStream activity={recent_activity} />
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
