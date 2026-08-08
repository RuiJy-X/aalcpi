import React, { useMemo, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
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
import {
    ArrowRight,
    BookOpen,
    Briefcase,
    CalendarDays,
    CheckCircle2,
    Clipboard,
    Clock3,
    DollarSign,
    LandPlot,
    LayoutGrid,
    Plus,
    ShieldCheck,
    Truck,
    User,
    Users,
    AlertTriangle,
    Loader2,
    FileSpreadsheet,
    Search,
    Filter,
    Activity,
    TrendingUp,
    BarChart2,
    Sparkles,
    Droplets,
    Scale,
    Building2,
    ChevronRight,
} from 'lucide-react';

import MillingPeriodsCalendar from '@/components/milling-periods/milling-periods-calendar';
import type { EventInput } from '@fullcalendar/core';
import { create as millingPeriodCreate } from '@/routes/milling-periods';
import { useCan } from '@/hooks/use-can';
import { cn } from '@/lib/utils';

// Import custom Tarsi Design System components
import {
    DashedArcGauge,
    SegmentedProgressBar,
    TarsiStatusBadge,
    VerticalBarComb,
} from '@/components/dashboard/tarsi-components';
import {
    TarsiModuleCard,
    ModuleSummaryItem,
} from '@/components/dashboard/tarsi-module-card';
import {
    TarsiTrendChart,
    MetricKey,
    TrendItem,
} from '@/components/dashboard/tarsi-trend-chart';
import {
    TarsiLeaderboard,
    LeaderboardItem,
} from '@/components/dashboard/tarsi-leaderboard';

type StatusTracking = {
    productions: {
        total: number;
        completed: number;
        draft: number;
        percent_complete: number;
    };
    payroll: {
        total: number;
        paid: number;
        pending: number;
        draft: number;
        percent_paid: number;
    };
    bank_reconciliation: {
        total: number;
        matched: number;
        outstanding: number;
        unrecorded: number;
        mismatch: number;
        match_rate: number;
    };
    imports: {
        queued: number;
        running: number;
        done: number;
        failed: number;
    };
};

type RecentActivityItem = {
    type: string;
    label: string;
    status: string;
    message?: string | null;
    at: string | null;
    href: string | null;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

const moduleIcons: Record<string, React.ElementType> = {
    planters: User,
    haciendas: LandPlot,
    productions: BookOpen,
    weekly: CalendarDays,
    milling_periods: ShieldCheck,
    bank_reconciliation: Truck,
    employees: Briefcase,
    attendance: Clipboard,
    payroll: DollarSign,
    users: Users,
    imports: FileSpreadsheet,
};

const moduleCategories: Record<string, 'operations' | 'finance' | 'hr' | 'system'> = {
    planters: 'operations',
    haciendas: 'operations',
    productions: 'operations',
    weekly: 'operations',
    milling_periods: 'finance',
    bank_reconciliation: 'finance',
    payroll: 'finance',
    employees: 'hr',
    attendance: 'hr',
    users: 'system',
    imports: 'system',
};

function formatCompact(value: number, decimals = 0) {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(Number.isFinite(value) ? value : 0);
}

function formatRelative(iso: string | null) {
    if (!iso) return '—';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString();
}

export default function Dashboard({
    crop_years,
    filters,
    kpi_totals,
    entity_counts,
    trend_data,
    leaderboard,
    milling_periods,
    module_summaries = [],
    status_tracking,
    recent_activity = [],
}: {
    crop_years: string[];
    filters: {
        crop_year?: string | null;
    };
    kpi_totals: {
        gross_cw: number;
        net_cw: number;
        trucks: number;
        actual_lkg: number;
        pshr_net_lkg: number;
        actual_mol: number;
        pshr_net_mol: number;
    } | null;
    entity_counts: {
        planters: number;
        haciendas: number;
    };
    trend_data: TrendItem[];
    leaderboard: LeaderboardItem[];
    milling_periods: Array<{
        id: number;
        week_no: number;
        crop_year: string;
        start_date: string;
        end_date: string;
        sugar_price: number;
        mol_price: number;
        sugar_factor: number;
        mol_factor: number;
    }>;
    module_summaries?: ModuleSummaryItem[];
    status_tracking?: StatusTracking;
    recent_activity?: RecentActivityItem[];
}) {
    const { can, canAny } = useCan();
    const selectedCropYear = filters?.crop_year ?? '';

    // Quick Directory Filter & Category tab state
    const [selectedCategory, setSelectedCategory] = useState<
        'all' | 'operations' | 'finance' | 'hr' | 'system'
    >('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Graph state
    const [trendMetricKey, setTrendMetricKey] = useState<MetricKey>('gross_cw');

    const kpi = kpi_totals ?? {
        gross_cw: 0,
        net_cw: 0,
        trucks: 0,
        actual_lkg: 0,
        pshr_net_lkg: 0,
        actual_mol: 0,
        pshr_net_mol: 0,
    };

    const tracking = status_tracking ?? {
        productions: { total: 0, completed: 0, draft: 0, percent_complete: 0 },
        payroll: { total: 0, paid: 0, pending: 0, draft: 0, percent_paid: 0 },
        bank_reconciliation: {
            total: 0,
            matched: 0,
            outstanding: 0,
            unrecorded: 0,
            mismatch: 0,
            match_rate: 0,
        },
        imports: { queued: 0, running: 0, done: 0, failed: 0 },
    };

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

    const calendarEvents = useMemo<EventInput[]>(() => {
        return milling_periods.map((period) => ({
            id: String(period.id),
            title: `Week ${period.week_no} (${period.crop_year}) - Sugar: ₱${Number(period.sugar_price).toFixed(2)}, Mol: ₱${Number(period.mol_price).toFixed(2)}`,
            start: period.start_date,
            end: period.end_date,
            allDay: true,
            extendedProps: {
                sugar_factor: period.sugar_factor,
                mol_factor: period.mol_factor,
            },
        }));
    }, [milling_periods]);

    // Attach category to module summaries
    const enrichedModules = useMemo(() => {
        return module_summaries.map((m) => ({
            ...m,
            category: moduleCategories[m.key] || 'operations',
        }));
    }, [module_summaries]);

    // Filter modules based on permission, category tab, and search query
    const visibleModules = useMemo(() => {
        return enrichedModules.filter((module) => {
            // Permission check
            let allowed = false;
            if (module.key === 'imports') {
                allowed = canAny([
                    'planters.import',
                    'productions.import',
                    'attendance.import',
                    'weekly.create',
                    'bank_reconciliation.create',
                ]);
            } else {
                allowed = can(module.permission);
            }
            if (!allowed) return false;

            // Category tab check
            if (selectedCategory !== 'all' && module.category !== selectedCategory) {
                return false;
            }

            // Search query check
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                return (
                    module.title.toLowerCase().includes(q) ||
                    module.metric_label.toLowerCase().includes(q) ||
                    module.detail.toLowerCase().includes(q)
                );
            }

            return true;
        });
    }, [enrichedModules, can, canAny, selectedCategory, searchQuery]);

    const attentionCount = module_summaries.filter(
        (m) => m.status === 'attention' || m.status === 'busy',
    ).length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Operations Dashboard" />

            {/* Page Container wrapper with Tarsi Page Background (#F5F4F1) */}
            <div className="space-y-6 pb-12 font-sans text-[#1B1B18]">
                {/* 1. Header & Crop Year Control Bar */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between rounded-[18px] border border-[#E7E6E2] bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <span className="flex size-9 items-center justify-center rounded-[10px] bg-[#E7F0E5] text-[#1F4B32]">
                                <Sparkles className="size-5" />
                            </span>
                            <h1 className="text-2xl font-bold text-[#1B1B18] tracking-tight">
                                Operations & Financial Dashboard
                            </h1>
                        </div>
                        <p className="mt-1 text-sm text-[#6E6E68]">
                            Central management hub for sugarcane production, milling periods, payroll, and reconciliation.
                            {attentionCount > 0 && (
                                <span className="ml-2 font-semibold text-[#C97A2B]">
                                    · {attentionCount} area{attentionCount === 1 ? '' : 's'} require attention
                                </span>
                            )}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* Crop Year Selector */}
                        <div className="flex items-center gap-2 rounded-xl border border-[#E7E6E2] bg-[#F2F1EE] px-3 py-1.5">
                            <span className="text-xs font-semibold text-[#6E6E68]">Crop Year</span>
                            <Select
                                value={selectedCropYear ?? ''}
                                onValueChange={applyCropYear}
                            >
                                <SelectTrigger className="w-36 border-none bg-white font-bold text-[#1B1B18] shadow-xs focus:ring-0">
                                    <SelectValue placeholder="Select year" />
                                </SelectTrigger>
                                <SelectContent className="bg-white">
                                    {crop_years.length === 0 ? (
                                        <SelectItem value="__no_crop_years__" disabled>
                                            No crop years
                                        </SelectItem>
                                    ) : (
                                        crop_years.map((cy) => (
                                            <SelectItem key={cy} value={cy}>
                                                {cy}
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Action Buttons */}
                        {can('milling_periods.create') && (
                            <Button
                                onClick={() => router.get(millingPeriodCreate().url)}
                                className="bg-[#1F4B32] hover:bg-[#153423] text-white font-semibold shadow-xs transition-colors rounded-xl"
                            >
                                <Plus className="mr-1.5 size-4" />
                                Add Milling Week
                            </Button>
                        )}
                    </div>
                </div>

                {/* 2. Primary KPI Cards Grid (Hero Cards) */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Card 1: Gross & Net CW */}
                    <div className="flex flex-col justify-between rounded-[18px] border border-[#E7E6E2] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all hover:border-[#1F4B32]/40">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <span className="text-[11px] font-semibold text-[#6E6E68] uppercase tracking-wider">
                                    Total Cane Weight
                                </span>
                                <h3 className="mt-1 text-2xl font-extrabold text-[#1B1B18] tracking-tight">
                                    {formatCompact(Number(kpi.gross_cw), 2)} <span className="text-xs font-normal text-[#6E6E68]">tons</span>
                                </h3>
                            </div>
                            <div className="flex size-10 items-center justify-center rounded-[10px] bg-[#E7F0E5] text-[#1F4B32]">
                                <BookOpen className="size-5" />
                            </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between rounded-[12px] bg-[#F2F1EE] p-3 text-xs">
                            <span className="text-[#6E6E68]">Net CW:</span>
                            <span className="font-bold text-[#1B1B18]">
                                {formatCompact(Number(kpi.net_cw), 2)} tons
                            </span>
                        </div>
                    </div>

                    {/* Card 2: Sugar Production (LKG) */}
                    <div className="flex flex-col justify-between rounded-[18px] border border-[#E7E6E2] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all hover:border-[#1F4B32]/40">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <span className="text-[11px] font-semibold text-[#6E6E68] uppercase tracking-wider">
                                    Actual LKG Yield
                                </span>
                                <h3 className="mt-1 text-2xl font-extrabold text-[#1B1B18] tracking-tight">
                                    {formatCompact(Number(kpi.actual_lkg), 2)} <span className="text-xs font-normal text-[#6E6E68]">LKG</span>
                                </h3>
                            </div>
                            <div className="flex size-10 items-center justify-center rounded-[10px] bg-[#E7F0E5] text-[#1F4B32]">
                                <Scale className="size-5" />
                            </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between rounded-[12px] bg-[#F2F1EE] p-3 text-xs">
                            <span className="text-[#6E6E68]">Pshr Net LKG:</span>
                            <span className="font-bold text-[#1B1B18]">
                                {formatCompact(Number(kpi.pshr_net_lkg), 2)} LKG
                            </span>
                        </div>
                    </div>

                    {/* Card 3: Molasses Production (Mol) */}
                    <div className="flex flex-col justify-between rounded-[18px] border border-[#E7E6E2] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all hover:border-[#1F4B32]/40">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <span className="text-[11px] font-semibold text-[#6E6E68] uppercase tracking-wider">
                                    Molasses Production
                                </span>
                                <h3 className="mt-1 text-2xl font-extrabold text-[#1B1B18] tracking-tight">
                                    {formatCompact(Number(kpi.actual_mol), 2)} <span className="text-xs font-normal text-[#6E6E68]">Mol</span>
                                </h3>
                            </div>
                            <div className="flex size-10 items-center justify-center rounded-[10px] bg-[#E7F0E5] text-[#1F4B32]">
                                <Droplets className="size-5" />
                            </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between rounded-[12px] bg-[#F2F1EE] p-3 text-xs">
                            <span className="text-[#6E6E68]">Pshr Net Mol:</span>
                            <span className="font-bold text-[#1B1B18]">
                                {formatCompact(Number(kpi.pshr_net_mol), 2)} Mol
                            </span>
                        </div>
                    </div>

                    {/* Card 4: Entities & Trucks */}
                    <div className="flex flex-col justify-between rounded-[18px] border border-[#E7E6E2] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all hover:border-[#1F4B32]/40">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <span className="text-[11px] font-semibold text-[#6E6E68] uppercase tracking-wider">
                                    Registered Planters
                                </span>
                                <h3 className="mt-1 text-2xl font-extrabold text-[#1B1B18] tracking-tight">
                                    {formatCompact(entity_counts.planters, 0)} <span className="text-xs font-normal text-[#6E6E68]">planters</span>
                                </h3>
                            </div>
                            <div className="flex size-10 items-center justify-center rounded-[10px] bg-[#E7F0E5] text-[#1F4B32]">
                                <User className="size-5" />
                            </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between rounded-[12px] bg-[#F2F1EE] p-3 text-xs">
                            <span className="text-[#6E6E68]">Haciendas / Trucks:</span>
                            <span className="font-bold text-[#1B1B18]">
                                {formatCompact(entity_counts.haciendas, 0)} / {formatCompact(Number(kpi.trucks), 0)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* 3. Section: Financial & Workflow Pulse (Signature Dashed Arc Gauges) */}
                <div>
                    <div className="mb-3">
                        <h2 className="text-lg font-bold text-[#1B1B18] tracking-tight">
                            Workflow & Financial Pulse
                        </h2>
                        <p className="text-xs text-[#6E6E68]">
                            Signature discrete radial gauges tracking live operational completion
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {/* Gauge 1: Production Completion */}
                        <DashedArcGauge
                            title="Production Status"
                            subtitle="Caneweigh tickets completion"
                            value={tracking.productions.percent_complete}
                            displayValue={`${tracking.productions.percent_complete}%`}
                            statusLabel={
                                tracking.productions.draft > 0
                                    ? `${tracking.productions.draft} Draft`
                                    : 'All Complete'
                            }
                            statusType={
                                tracking.productions.draft > 0
                                    ? 'warning'
                                    : 'positive'
                            }
                            minLabel="0%"
                            maxLabel="100%"
                        />

                        {/* Gauge 2: Payroll Processing */}
                        <DashedArcGauge
                            title="Payroll Disbursement"
                            subtitle="Paid salary records vs pending"
                            value={tracking.payroll.percent_paid}
                            displayValue={`${tracking.payroll.percent_paid}%`}
                            statusLabel={
                                tracking.payroll.pending > 0
                                    ? `${tracking.payroll.pending} Pending`
                                    : 'Fully Paid'
                            }
                            statusType={
                                tracking.payroll.pending > 0
                                    ? 'warning'
                                    : 'positive'
                            }
                            minLabel="0%"
                            maxLabel="100%"
                        />

                        {/* Gauge 3: Bank Reconciliation Match Rate */}
                        <DashedArcGauge
                            title="Bank Recon Match"
                            subtitle="Matched statement & disbursement rows"
                            value={tracking.bank_reconciliation.match_rate}
                            displayValue={`${tracking.bank_reconciliation.match_rate}%`}
                            statusLabel={
                                tracking.bank_reconciliation.outstanding > 0
                                    ? `${tracking.bank_reconciliation.outstanding} Unmatched`
                                    : 'Balanced'
                            }
                            statusType={
                                tracking.bank_reconciliation.outstanding > 0
                                    ? 'warning'
                                    : 'positive'
                            }
                            minLabel="0%"
                            maxLabel="100%"
                        />

                        {/* Gauge 4: Import Queue Health */}
                        <DashedArcGauge
                            title="Import Data Health"
                            subtitle="PDF & Excel ingestion jobs"
                            value={
                                tracking.imports.done + tracking.imports.failed > 0
                                    ? Math.round(
                                          (tracking.imports.done /
                                              (tracking.imports.done +
                                                  tracking.imports.failed +
                                                  tracking.imports.running +
                                                  tracking.imports.queued)) *
                                              100,
                                      )
                                    : 100
                            }
                            displayValue={`${tracking.imports.done} Done`}
                            statusLabel={
                                tracking.imports.failed > 0
                                    ? `${tracking.imports.failed} Failed`
                                    : 'Queue Healthy'
                            }
                            statusType={
                                tracking.imports.failed > 0
                                    ? 'negative'
                                    : 'positive'
                            }
                            minLabel="0"
                            maxLabel="Jobs"
                        />
                    </div>
                </div>

                {/* 4. Section: System Page & Module Directory (Quick Access Cards) */}
                <div className="rounded-[18px] border border-[#E7E6E2] bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-[#E7E6E2] pb-4 mb-6">
                        <div>
                            <div className="flex items-center gap-2">
                                <LayoutGrid className="size-5 text-[#1F4B32]" />
                                <h2 className="text-lg font-bold text-[#1B1B18] tracking-tight">
                                    System Page Directory
                                </h2>
                            </div>
                            <p className="text-xs text-[#6E6E68] mt-0.5">
                                Description and live status of every page in the application. Click any card to navigate directly.
                            </p>
                        </div>

                        {/* Search and Category Filter Controls */}
                        <div className="flex flex-wrap items-center gap-3">
                            {/* Search box */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#A5A49E]" />
                                <input
                                    type="text"
                                    placeholder="Search modules..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-48 rounded-xl border border-[#E7E6E2] bg-[#F2F1EE] pl-9 pr-3 py-1.5 text-xs text-[#1B1B18] placeholder-[#A5A49E] focus:border-[#1F4B32] focus:bg-white focus:outline-none"
                                />
                            </div>

                            {/* Category Filter Tabs */}
                            <div className="flex items-center rounded-xl bg-[#F2F1EE] p-1 border border-[#E7E6E2]">
                                <button
                                    onClick={() => setSelectedCategory('all')}
                                    className={cn(
                                        'rounded-lg px-3 py-1 text-xs font-semibold transition-all',
                                        selectedCategory === 'all'
                                            ? 'bg-white text-[#1F4B32] shadow-xs'
                                            : 'text-[#6E6E68] hover:text-[#1B1B18]',
                                    )}
                                >
                                    All
                                </button>
                                <button
                                    onClick={() => setSelectedCategory('operations')}
                                    className={cn(
                                        'rounded-lg px-3 py-1 text-xs font-semibold transition-all',
                                        selectedCategory === 'operations'
                                            ? 'bg-white text-[#1F4B32] shadow-xs'
                                            : 'text-[#6E6E68] hover:text-[#1B1B18]',
                                    )}
                                >
                                    Operations
                                </button>
                                <button
                                    onClick={() => setSelectedCategory('finance')}
                                    className={cn(
                                        'rounded-lg px-3 py-1 text-xs font-semibold transition-all',
                                        selectedCategory === 'finance'
                                            ? 'bg-white text-[#1F4B32] shadow-xs'
                                            : 'text-[#6E6E68] hover:text-[#1B1B18]',
                                    )}
                                >
                                    Finance
                                </button>
                                <button
                                    onClick={() => setSelectedCategory('hr')}
                                    className={cn(
                                        'rounded-lg px-3 py-1 text-xs font-semibold transition-all',
                                        selectedCategory === 'hr'
                                            ? 'bg-white text-[#1F4B32] shadow-xs'
                                            : 'text-[#6E6E68] hover:text-[#1B1B18]',
                                    )}
                                >
                                    HR & Admin
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Directory Cards Grid */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {visibleModules.map((module) => {
                            const Icon = moduleIcons[module.key] ?? LayoutGrid;
                            return (
                                <TarsiModuleCard
                                    key={module.key}
                                    module={module}
                                    icon={Icon}
                                />
                            );
                        })}

                        {visibleModules.length === 0 && (
                            <div className="col-span-full rounded-[18px] border border-dashed border-[#E7E6E2] p-12 text-center text-sm text-[#6E6E68]">
                                No system modules match your selected category or search filter.
                            </div>
                        )}
                    </div>
                </div>

                {/* 5. Section: Analytics & Interactive Visualizations */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                    {/* Left 7 cols: Production Trend SVG Graph */}
                    <div className="lg:col-span-7">
                        <TarsiTrendChart
                            data={trend_data}
                            metricKey={trendMetricKey}
                            metricLabel={
                                trendMetricKey.replace('_', ' ').toUpperCase()
                            }
                            onMetricChange={setTrendMetricKey}
                        />
                    </div>

                    {/* Right 5 cols: Planters Leaderboard */}
                    <div className="lg:col-span-5">
                        <TarsiLeaderboard
                            leaderboard={leaderboard}
                            selectedCropYear={selectedCropYear}
                        />
                    </div>
                </div>

                {/* 6. Section: Calendar & Recent Activity Feed */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                    {/* Left 7 cols: Milling Schedule Calendar */}
                    <div className="lg:col-span-7 rounded-[18px] border border-[#E7E6E2] bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                        <div className="flex items-center justify-between border-b border-[#E7E6E2] pb-4 mb-4">
                            <div>
                                <h3 className="text-[17px] font-semibold text-[#1B1B18] leading-tight">
                                    Milling Periods Calendar
                                </h3>
                                <p className="text-xs text-[#6E6E68]">
                                    Weekly milling schedules, sugar factors, and molasses prices
                                </p>
                            </div>
                            {can('milling_periods.create') && (
                                <Button
                                    size="sm"
                                    onClick={() => router.get(millingPeriodCreate().url)}
                                    className="bg-[#1F4B32] hover:bg-[#153423] text-white rounded-lg text-xs"
                                >
                                    <Plus className="mr-1 size-3.5" /> Add Week
                                </Button>
                            )}
                        </div>
                        <MillingPeriodsCalendar events={calendarEvents} />
                    </div>

                    {/* Right 5 cols: Recent Import Activity */}
                    <div className="lg:col-span-5 rounded-[18px] border border-[#E7E6E2] bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between border-b border-[#E7E6E2] pb-4 mb-4">
                                <div className="flex items-center gap-2">
                                    <Clock3 className="size-4 text-[#1F4B32]" />
                                    <h3 className="text-[17px] font-semibold text-[#1B1B18]">
                                        Recent Import Activity
                                    </h3>
                                </div>
                                <span className="text-xs text-[#6E6E68]">
                                    Live Ingestion Log
                                </span>
                            </div>

                            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                                {recent_activity.length === 0 && (
                                    <p className="py-12 text-center text-xs text-[#6E6E68]">
                                        No recent file import background activity recorded.
                                    </p>
                                )}
                                {recent_activity.map((item, index) => (
                                    <div
                                        key={`${item.type}-${index}-${item.at}`}
                                        className="rounded-[12px] border border-[#E7E6E2] bg-[#F2F1EE]/60 p-3 text-xs transition-colors hover:bg-white"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="font-semibold text-[#1B1B18] line-clamp-1">
                                                {item.label}
                                            </p>
                                            <TarsiStatusBadge
                                                label={item.status}
                                                type={
                                                    item.status === 'done'
                                                        ? 'positive'
                                                        : item.status === 'failed'
                                                          ? 'negative'
                                                          : 'warning'
                                                }
                                            />
                                        </div>
                                        <p className="mt-1 text-[11px] text-[#6E6E68]">
                                            {formatRelative(item.at)}
                                        </p>
                                        {item.message && (
                                            <p className="mt-1 text-[11px] text-[#6E6E68] line-clamp-2 italic">
                                                {item.message}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-4 border-t border-[#E7E6E2] pt-3 text-center text-xs text-[#6E6E68]">
                            Automated background ingestion runs continuously.
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
