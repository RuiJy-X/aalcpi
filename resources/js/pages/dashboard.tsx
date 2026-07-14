import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import StatCard from '@/components/stat-card';
import {
    Container,
    ContainerHeader,
    ContainerHeaderEnd,
} from '@/components/container';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
} from 'lucide-react';
import { useMemo, useState, type ComponentType } from 'react';
import MillingPeriodsCalendar from '@/components/milling-periods/milling-periods-calendar';
import type { EventInput } from '@fullcalendar/core';
import { create as millingPeriodCreate } from '@/routes/milling-periods';
import { useCan } from '@/hooks/use-can';
import { cn } from '@/lib/utils';

const metricOptions = [
    { key: 'gross_cw', label: 'Gross CW', decimals: 2 },
    { key: 'net_cw', label: 'Net CW', decimals: 2 },
    { key: 'trucks', label: 'Trucks', decimals: 0 },
    { key: 'pshr_net_lkg', label: 'Pshr Net LKG', decimals: 2 },
    { key: 'actual_lkg', label: 'Actual LKG', decimals: 2 },
    { key: 'actual_mol', label: 'Actual Mol', decimals: 2 },
    { key: 'pshr_net_mol', label: 'Pshr Net Mol', decimals: 2 },
] as const;

type MetricKey = (typeof metricOptions)[number]['key'];

type ModuleSummary = {
    key: string;
    title: string;
    permission: string;
    href: string;
    metric: number;
    metric_label: string;
    status: 'healthy' | 'attention' | 'busy' | 'idle' | 'empty';
    status_label: string;
    detail: string;
    progress: number | null;
    accent: string;
};

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

const moduleIcons: Record<string, ComponentType<{ className?: string }>> = {
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

const accentClasses: Record<string, string> = {
    green: 'border-l-green-600 bg-green-50/40',
    purple: 'border-l-violet-600 bg-violet-50/40',
    amber: 'border-l-amber-600 bg-amber-50/40',
    teal: 'border-l-teal-600 bg-teal-50/40',
    indigo: 'border-l-indigo-600 bg-indigo-50/40',
    blue: 'border-l-blue-600 bg-blue-50/40',
    cyan: 'border-l-cyan-600 bg-cyan-50/40',
    orange: 'border-l-orange-600 bg-orange-50/40',
    lime: 'border-l-lime-600 bg-lime-50/40',
    gray: 'border-l-gray-500 bg-gray-50/40',
    brown: 'border-l-amber-900 bg-amber-100/40',
};

const statusBadge: Record<
    ModuleSummary['status'],
    { label?: string; className: string }
> = {
    healthy: {
        className: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    },
    attention: {
        className: 'bg-amber-100 text-amber-900 border-amber-200',
    },
    busy: { className: 'bg-sky-100 text-sky-900 border-sky-200' },
    idle: { className: 'bg-slate-100 text-slate-700 border-slate-200' },
    empty: { className: 'bg-rose-50 text-rose-800 border-rose-200' },
};

function formatCompact(value: number, decimals = 0) {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(Number.isFinite(value) ? value : 0);
}

function formatRelative(iso: string | null) {
    if (!iso) {
        return '—';
    }
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
        return '—';
    }
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
    trend_data: Array<{
        crop_year: string;
        gross_cw: number;
        net_cw: number;
        trucks: number;
        actual_lkg: number;
        pshr_net_lkg: number;
        actual_mol: number;
        pshr_net_mol: number;
    }>;
    leaderboard: Array<{
        planter_id: number;
        planter_name: string;
        hacienda_name: string;
        gross_cw: number;
        net_cw: number;
        trucks: number;
        actual_lkg: number;
        pshr_net_lkg: number;
        actual_mol: number;
        pshr_net_mol: number;
    }>;
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
    module_summaries?: ModuleSummary[];
    status_tracking?: StatusTracking;
    recent_activity?: RecentActivityItem[];
}) {
    const { can, canAny } = useCan();
    const selectedCropYear = filters?.crop_year ?? '';
    const [selectedTrendKey, setSelectedTrendKey] =
        useState<MetricKey>('gross_cw');
    const [selectedLeaderboardKey, setSelectedLeaderboardKey] =
        useState<MetricKey>('gross_cw');

    const kpi = kpi_totals ?? {
        gross_cw: 0,
        net_cw: 0,
        trucks: 0,
        actual_lkg: 0,
        pshr_net_lkg: 0,
        actual_mol: 0,
        pshr_net_mol: 0,
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
            title: `Week ${period.week_no} (${period.crop_year}) - PHP/LKG: ${Number(period.sugar_price).toFixed(2)}, PHP/MOL: ${Number(period.mol_price).toFixed(2)}`,
            start: period.start_date,
            end: period.end_date,
            allDay: true,
            extendedProps: {
                sugar_factor: period.sugar_factor,
                mol_factor: period.mol_factor,
            },
        }));
    }, [milling_periods]);

    const topPlanters = useMemo(() => {
        const metricKey = selectedLeaderboardKey;
        return [...leaderboard]
            .sort((a, b) => Number(b[metricKey]) - Number(a[metricKey]))
            .slice(0, 5);
    }, [leaderboard, selectedLeaderboardKey]);

    const visibleModules = useMemo(
        () =>
            module_summaries.filter((module) => {
                if (module.key === 'imports') {
                    return canAny([
                        'planters.import',
                        'productions.import',
                        'attendance.import',
                        'weekly.create',
                        'bank_reconciliation.create',
                    ]);
                }
                return can(module.permission);
            }),
        [module_summaries, can, canAny],
    );

    const attentionCount = visibleModules.filter(
        (m) => m.status === 'attention' || m.status === 'busy',
    ).length;

    const trendMetric = metricOptions.find(
        (metric) => metric.key === selectedTrendKey,
    );
    const leaderboardMetric = metricOptions.find(
        (metric) => metric.key === selectedLeaderboardKey,
    );

    const tracking = status_tracking ?? {
        productions: {
            total: 0,
            completed: 0,
            draft: 0,
            percent_complete: 0,
        },
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            {/* Header */}
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Operations Dashboard
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Snapshot of every module, workflow progress, and quick
                        actions
                        {attentionCount > 0
                            ? ` · ${attentionCount} area${attentionCount === 1 ? '' : 's'} need attention`
                            : ''}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Crop Year</span>
                    <Select
                        value={selectedCropYear ?? ''}
                        onValueChange={applyCropYear}
                    >
                        <SelectTrigger className="w-44 bg-white">
                            <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                            {crop_years.length === 0 ? (
                                <SelectItem value="__no_crop_years__" disabled>
                                    No crop years
                                </SelectItem>
                            ) : (
                                crop_years.map((cropYear) => (
                                    <SelectItem
                                        key={cropYear}
                                        value={cropYear}
                                    >
                                        {cropYear}
                                    </SelectItem>
                                ))
                            )}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Production KPI strip */}
            <div className="mt-2 flex grow gap-2 overflow-x-auto pb-1">
                <StatCard
                    title="Gross CW"
                    value={formatCompact(Number(kpi.gross_cw), 2)}
                    icon={BookOpen}
                    color="amber"
                />
                <StatCard
                    title="Net CW"
                    value={formatCompact(Number(kpi.net_cw), 2)}
                    icon={LandPlot}
                    color="orange"
                />
                <StatCard
                    title="Trucks"
                    value={formatCompact(Number(kpi.trucks), 0)}
                    icon={Clipboard}
                    color="blue"
                />
                <StatCard
                    title="Actual LKG"
                    value={formatCompact(Number(kpi.actual_lkg), 2)}
                    icon={Clipboard}
                    color="teal"
                />
                <StatCard
                    title="Pshr Net LKG"
                    value={formatCompact(Number(kpi.pshr_net_lkg), 2)}
                    icon={Clipboard}
                    color="indigo"
                />
                <StatCard
                    title="Actual Mol"
                    value={formatCompact(Number(kpi.actual_mol), 2)}
                    icon={Clipboard}
                    color="gray"
                />
                <StatCard
                    title="Pshr Net Mol"
                    value={formatCompact(Number(kpi.pshr_net_mol), 2)}
                    icon={Clipboard}
                    color="brown"
                />
                <StatCard
                    title="Distinct Planters"
                    value={formatCompact(entity_counts.planters, 0)}
                    icon={User}
                    color="green"
                />
                <StatCard
                    title="Distinct Haciendas"
                    value={formatCompact(entity_counts.haciendas, 0)}
                    icon={LandPlot}
                    color="purple"
                />
            </div>

            {/* Module quick access */}
            <Container className="mt-4">
                <ContainerHeader>
                    <div>
                        <div className="text-2xl font-semibold">
                            Module overview
                        </div>
                        <p className="text-sm font-normal text-muted-foreground">
                            Jump into any area · status reflects live counts
                        </p>
                    </div>
                </ContainerHeader>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    {visibleModules.map((module) => {
                        const Icon =
                            moduleIcons[module.key] ?? LayoutGrid;
                        const accent =
                            accentClasses[module.accent] ??
                            accentClasses.gray;
                        const badge = statusBadge[module.status];

                        return (
                            <Link
                                key={module.key}
                                href={module.href}
                                className={cn(
                                    'group flex flex-col rounded-xl border border-l-4 bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md',
                                    accent,
                                )}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <span className="flex size-9 items-center justify-center rounded-lg bg-background/80 shadow-sm">
                                            <Icon className="size-4 text-foreground" />
                                        </span>
                                        <div>
                                            <div className="font-semibold leading-tight">
                                                {module.title}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {module.metric_label}
                                            </div>
                                        </div>
                                    </div>
                                    <Badge
                                        variant="outline"
                                        className={cn(
                                            'shrink-0 text-[10px]',
                                            badge.className,
                                        )}
                                    >
                                        {module.status === 'attention' && (
                                            <AlertTriangle className="mr-1 size-3" />
                                        )}
                                        {module.status === 'busy' && (
                                            <Loader2 className="mr-1 size-3 animate-spin" />
                                        )}
                                        {module.status === 'healthy' && (
                                            <CheckCircle2 className="mr-1 size-3" />
                                        )}
                                        {module.status_label}
                                    </Badge>
                                </div>

                                <div className="mt-3 text-3xl font-bold tracking-tight">
                                    {formatCompact(module.metric, 0)}
                                </div>
                                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                                    {module.detail}
                                </p>

                                {module.progress !== null &&
                                    module.progress !== undefined && (
                                        <div className="mt-3 space-y-1">
                                            <div className="flex justify-between text-[11px] text-muted-foreground">
                                                <span>Progress</span>
                                                <span>{module.progress}%</span>
                                            </div>
                                            <Progress
                                                value={Math.min(
                                                    100,
                                                    Math.max(
                                                        0,
                                                        module.progress,
                                                    ),
                                                )}
                                                className="h-1.5"
                                            />
                                        </div>
                                    )}

                                <div className="mt-3 flex items-center text-xs font-medium text-primary opacity-80 transition group-hover:opacity-100">
                                    Open
                                    <ArrowRight className="ml-1 size-3.5 transition group-hover:translate-x-0.5" />
                                </div>
                            </Link>
                        );
                    })}
                    {visibleModules.length === 0 && (
                        <div className="col-span-full rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                            No modules available for your permissions.
                        </div>
                    )}
                </div>
            </Container>

            {/* Progress tracking */}
            <div className="mt-2 grid grid-cols-1 gap-3 lg:grid-cols-2 2xl:grid-cols-4">
                {can('productions.view') && (
                    <ProgressPanel
                        title="Production completion"
                        href="/Productions"
                        percent={tracking.productions.percent_complete}
                        footer={`${tracking.productions.completed} completed · ${tracking.productions.draft} draft`}
                        segments={[
                            {
                                label: 'Completed',
                                value: tracking.productions.completed,
                                className: 'bg-emerald-500',
                            },
                            {
                                label: 'Draft',
                                value: tracking.productions.draft,
                                className: 'bg-amber-400',
                            },
                        ]}
                    />
                )}
                {can('payroll.view') && (
                    <ProgressPanel
                        title="Payroll paid"
                        href="/Payroll"
                        percent={tracking.payroll.percent_paid}
                        footer={`${tracking.payroll.paid} paid · ${tracking.payroll.pending} pending · ${tracking.payroll.draft} draft`}
                        segments={[
                            {
                                label: 'Paid',
                                value: tracking.payroll.paid,
                                className: 'bg-emerald-500',
                            },
                            {
                                label: 'Pending',
                                value: tracking.payroll.pending,
                                className: 'bg-sky-500',
                            },
                            {
                                label: 'Draft',
                                value: tracking.payroll.draft,
                                className: 'bg-amber-400',
                            },
                        ]}
                    />
                )}
                {can('bank_reconciliation.view') && (
                    <ProgressPanel
                        title="Bank recon match rate"
                        href="/BankReconciliation"
                        percent={tracking.bank_reconciliation.match_rate}
                        footer={`${tracking.bank_reconciliation.matched} matched · ${tracking.bank_reconciliation.outstanding} outstanding · ${tracking.bank_reconciliation.unrecorded} unrecorded`}
                        segments={[
                            {
                                label: 'Matched',
                                value: tracking.bank_reconciliation.matched,
                                className: 'bg-emerald-500',
                            },
                            {
                                label: 'Outstanding',
                                value: tracking.bank_reconciliation
                                    .outstanding,
                                className: 'bg-amber-400',
                            },
                            {
                                label: 'Unrecorded',
                                value: tracking.bank_reconciliation
                                    .unrecorded,
                                className: 'bg-rose-400',
                            },
                            {
                                label: 'Mismatch',
                                value: tracking.bank_reconciliation.mismatch,
                                className: 'bg-orange-500',
                            },
                        ]}
                    />
                )}
                {canAny([
                    'planters.import',
                    'productions.import',
                    'attendance.import',
                    'weekly.create',
                ]) && (
                    <ProgressPanel
                        title="Import pipeline (7d)"
                        href="/Productions"
                        percent={
                            tracking.imports.done +
                                tracking.imports.failed +
                                tracking.imports.running +
                                tracking.imports.queued >
                            0
                                ? Math.round(
                                      (tracking.imports.done /
                                          Math.max(
                                              1,
                                              tracking.imports.done +
                                                  tracking.imports.failed +
                                                  tracking.imports.running +
                                                  tracking.imports.queued,
                                          )) *
                                          100,
                                  )
                                : 100
                        }
                        footer={`${tracking.imports.running} running · ${tracking.imports.queued} queued · ${tracking.imports.failed} failed · ${tracking.imports.done} done`}
                        segments={[
                            {
                                label: 'Done',
                                value: tracking.imports.done,
                                className: 'bg-emerald-500',
                            },
                            {
                                label: 'Running',
                                value: tracking.imports.running,
                                className: 'bg-sky-500',
                            },
                            {
                                label: 'Queued',
                                value: tracking.imports.queued,
                                className: 'bg-slate-400',
                            },
                            {
                                label: 'Failed',
                                value: tracking.imports.failed,
                                className: 'bg-rose-500',
                            },
                        ]}
                    />
                )}
            </div>

            {/* Charts + activity */}
            <div className="mt-2 grid grid-cols-1 gap-2 2xl:grid-cols-3">
                <Container className="2xl:col-span-2">
                    <ContainerHeader>
                        Production Graph
                        <ContainerHeaderEnd>
                            <Select
                                value={selectedTrendKey}
                                onValueChange={(nextValue) =>
                                    setSelectedTrendKey(nextValue as MetricKey)
                                }
                            >
                                <SelectTrigger className="w-52">
                                    <SelectValue placeholder="Select metric" />
                                </SelectTrigger>
                                <SelectContent>
                                    {metricOptions.map((metric) => (
                                        <SelectItem
                                            key={metric.key}
                                            value={metric.key}
                                        >
                                            {metric.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </ContainerHeaderEnd>
                    </ContainerHeader>
                    <TrendLineChart
                        data={trend_data}
                        metricKey={selectedTrendKey}
                        label={trendMetric?.label ?? 'Metric'}
                    />
                </Container>

                <Container>
                    <ContainerHeader>
                        Recent imports
                        <Clock3 className="size-4 text-muted-foreground" />
                    </ContainerHeader>
                    <div className="max-h-[320px] space-y-2 overflow-y-auto">
                        {recent_activity.length === 0 && (
                            <p className="py-8 text-center text-sm text-muted-foreground">
                                No recent import activity.
                            </p>
                        )}
                        {recent_activity.map((item, index) => (
                            <div
                                key={`${item.type}-${index}-${item.at}`}
                                className="rounded-lg border bg-muted/20 px-3 py-2"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <p className="line-clamp-2 text-sm font-medium">
                                        {item.label}
                                    </p>
                                    <Badge
                                        variant="outline"
                                        className={cn(
                                            'shrink-0 text-[10px] capitalize',
                                            item.status === 'done' &&
                                                'border-emerald-200 bg-emerald-50 text-emerald-800',
                                            item.status === 'failed' &&
                                                'border-rose-200 bg-rose-50 text-rose-800',
                                            (item.status === 'running' ||
                                                item.status === 'queued') &&
                                                'border-sky-200 bg-sky-50 text-sky-800',
                                        )}
                                    >
                                        {item.status}
                                    </Badge>
                                </div>
                                <p className="mt-1 text-[11px] text-muted-foreground">
                                    {formatRelative(item.at)}
                                </p>
                                {item.message && (
                                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                                        {item.message}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </Container>
            </div>

            <div className="grid grid-cols-1 2xl:grid-cols-2">
                <Container>
                    <ContainerHeader>
                        Planters Leaderboard
                        <ContainerHeaderEnd>
                            <Select
                                value={selectedLeaderboardKey}
                                onValueChange={(nextValue) =>
                                    setSelectedLeaderboardKey(
                                        nextValue as MetricKey,
                                    )
                                }
                            >
                                <SelectTrigger className="w-52">
                                    <SelectValue placeholder="Select metric" />
                                </SelectTrigger>
                                <SelectContent>
                                    {metricOptions.map((metric) => (
                                        <SelectItem
                                            key={metric.key}
                                            value={metric.key}
                                        >
                                            {metric.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </ContainerHeaderEnd>
                    </ContainerHeader>

                    <div className="mt-4 overflow-hidden rounded-lg border border-border/70">
                        <div className="grid grid-cols-[80px_1.5fr_1fr_1fr] gap-2 bg-muted/40 px-4 py-3 text-sm font-semibold text-gray-600">
                            <div>Rank</div>
                            <div>Planter</div>
                            <div>Hacienda</div>
                            <div className="text-right">
                                {leaderboardMetric?.label ?? 'Metric'}
                            </div>
                        </div>
                        <div className="divide-y divide-border/70">
                            {topPlanters.map((row, index) => (
                                <div
                                    key={row.planter_id}
                                    className="grid grid-cols-[80px_1.5fr_1fr_1fr] gap-2 px-4 py-3 text-sm"
                                >
                                    <div className="font-semibold text-gray-800">
                                        #{index + 1}
                                    </div>
                                    <div className="font-medium text-gray-900">
                                        {row.planter_name || 'Unknown'}
                                    </div>
                                    <div className="text-gray-600">
                                        {row.hacienda_name || 'Unassigned'}
                                    </div>
                                    <div className="text-right font-semibold text-gray-900">
                                        {formatCompact(
                                            Number(
                                                row[selectedLeaderboardKey] ??
                                                    0,
                                            ),
                                            metricOptions.find(
                                                (metric) =>
                                                    metric.key ===
                                                    selectedLeaderboardKey,
                                            )?.decimals ?? 2,
                                        )}
                                    </div>
                                </div>
                            ))}
                            {topPlanters.length === 0 && (
                                <div className="px-4 py-6 text-center text-sm text-gray-500">
                                    No planter data for this crop year.
                                </div>
                            )}
                        </div>
                    </div>
                </Container>

                <Container>
                    <ContainerHeader>
                        Milling Period Calendar
                        {can('milling_periods.create') && (
                            <Button
                                onClick={() =>
                                    router.get(millingPeriodCreate().url)
                                }
                            >
                                <Plus />
                                Add Week
                            </Button>
                        )}
                    </ContainerHeader>
                    <MillingPeriodsCalendar events={calendarEvents} />
                </Container>
            </div>
        </AppLayout>
    );
}

function ProgressPanel({
    title,
    href,
    percent,
    footer,
    segments,
}: {
    title: string;
    href: string;
    percent: number;
    footer: string;
    segments: { label: string; value: number; className: string }[];
}) {
    const total = segments.reduce((sum, s) => sum + s.value, 0);

    return (
        <div className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">
                        {title}
                    </p>
                    <p className="mt-1 text-3xl font-bold tracking-tight">
                        {Math.round(percent)}%
                    </p>
                </div>
                <Button variant="ghost" size="sm" asChild>
                    <Link href={href}>
                        View
                        <ArrowRight className="size-3.5" />
                    </Link>
                </Button>
            </div>
            <Progress
                value={Math.min(100, Math.max(0, percent))}
                className="mt-3 h-2"
            />
            {total > 0 && (
                <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-muted">
                    {segments.map((segment) =>
                        segment.value > 0 ? (
                            <div
                                key={segment.label}
                                className={cn('h-full', segment.className)}
                                style={{
                                    width: `${(segment.value / total) * 100}%`,
                                }}
                                title={`${segment.label}: ${segment.value}`}
                            />
                        ) : null,
                    )}
                </div>
            )}
            <p className="mt-2 text-xs text-muted-foreground">{footer}</p>
            <div className="mt-2 flex flex-wrap gap-2">
                {segments.map((segment) => (
                    <span
                        key={segment.label}
                        className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground"
                    >
                        <span
                            className={cn(
                                'inline-block size-2 rounded-full',
                                segment.className,
                            )}
                        />
                        {segment.label} ({segment.value})
                    </span>
                ))}
            </div>
        </div>
    );
}

type TrendLineChartProps = {
    data: Array<{
        crop_year: string;
        gross_cw: number;
        net_cw: number;
        trucks: number;
        actual_lkg: number;
        pshr_net_lkg: number;
        actual_mol: number;
        pshr_net_mol: number;
    }>;
    metricKey: MetricKey;
    label: string;
};

const TrendLineChart = ({ data, metricKey, label }: TrendLineChartProps) => {
    const values = data.map((item) => Number(item[metricKey] ?? 0));
    const maxValue = Math.max(...values, 0);
    const minValue = Math.min(...values, 0);
    const range = maxValue - minValue || 1;
    const width = 720;
    const height = 260;
    const padding = { top: 24, right: 24, bottom: 48, left: 56 };

    if (data.length === 0) {
        return (
            <div className="rounded-lg border border-border/70 bg-muted/30 p-8 text-center text-sm text-gray-500">
                No trend data available.
            </div>
        );
    }

    const points = values.map((value, index) => {
        const x =
            padding.left +
            (index / Math.max(values.length - 1, 1)) *
                (width - padding.left - padding.right);
        const y =
            padding.top +
            (1 - (value - minValue) / range) *
                (height - padding.top - padding.bottom);
        return { x, y };
    });

    const path = points
        .map(
            (point, index) =>
                `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`,
        )
        .join(' ');

    const areaPath = `${path} L ${width - padding.right} ${height - padding.bottom} L ${padding.left} ${height - padding.bottom} Z`;
    const gridLines = 4;

    return (
        <div className="rounded-lg border border-border/70 bg-white p-4 shadow-sm">
            <div className="mb-3 text-sm font-semibold text-gray-700">
                {label} by Crop Year
            </div>
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
                <defs>
                    <linearGradient
                        id="trendFill"
                        x1="0%"
                        y1="0%"
                        x2="0%"
                        y2="100%"
                    >
                        <stop
                            offset="0%"
                            stopColor="#6FA8DC"
                            stopOpacity="0.25"
                        />
                        <stop
                            offset="100%"
                            stopColor="#6FA8DC"
                            stopOpacity="0"
                        />
                    </linearGradient>
                </defs>

                {[...Array(gridLines + 1)].map((_, index) => {
                    const y =
                        padding.top +
                        (index / gridLines) *
                            (height - padding.top - padding.bottom);
                    return (
                        <line
                            key={`grid-${index}`}
                            x1={padding.left}
                            x2={width - padding.right}
                            y1={y}
                            y2={y}
                            stroke="#E5E7EB"
                            strokeDasharray="4 4"
                        />
                    );
                })}

                <path d={areaPath} fill="url(#trendFill)" />
                <path d={path} fill="none" stroke="#2563EB" strokeWidth="2" />
                {points.map((point, index) => (
                    <circle
                        key={`point-${index}`}
                        cx={point.x}
                        cy={point.y}
                        r={4}
                        fill="#2563EB"
                    />
                ))}

                {data.map((item, index) => {
                    const x = points[index].x;
                    const y = height - padding.bottom + 18;
                    return (
                        <text
                            key={`label-${item.crop_year}`}
                            x={x}
                            y={y}
                            textAnchor="middle"
                            fontSize="10"
                            fill="#6B7280"
                        >
                            {item.crop_year}
                        </text>
                    );
                })}

                <text
                    x={padding.left}
                    y={padding.top - 8}
                    fontSize="10"
                    fill="#6B7280"
                >
                    {maxValue.toFixed(0)}
                </text>
                <text
                    x={padding.left}
                    y={height - padding.bottom + 4}
                    fontSize="10"
                    fill="#6B7280"
                >
                    {minValue.toFixed(0)}
                </text>
            </svg>
        </div>
    );
};
