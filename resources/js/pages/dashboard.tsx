import { Head, router } from '@inertiajs/react';
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
import {
    BookOpen,
    Clipboard,
    LandPlot,
    Plus,
    RefreshCw,
    User,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import MillingPeriodsCalendar from '@/components/milling-periods/milling-periods-calendar';
import type { EventInput } from '@fullcalendar/core';
import { create as millingPeriodCreate } from '@/routes/MillingPeriods';

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

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

export default function Dashboard({
    crop_years,
    filters,
    kpi_totals,
    entity_counts,
    trend_data,
    leaderboard,
    milling_periods,
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
}) {
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

    const formatNumber = (value: number, decimals = 2) =>
        new Intl.NumberFormat('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        }).format(Number.isFinite(value) ? value : 0);

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

    const trendMetric = metricOptions.find(
        (metric) => metric.key === selectedTrendKey,
    );

    const leaderboardMetric = metricOptions.find(
        (metric) => metric.key === selectedLeaderboardKey,
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard"></Head>

            <div className="flex items-center gap-2">
                <span className="text-md font-medium text-black">
                    Crop Year
                </span>
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
                                <SelectItem key={cropYear} value={cropYear}>
                                    {cropYear}
                                </SelectItem>
                            ))
                        )}
                    </SelectContent>
                </Select>
            </div>

            <div className="mt-4">
                <div className="mt-3 flex grow gap-2 overflow-x-auto">
                    <StatCard
                        title="Gross CW"
                        value={formatNumber(kpi.gross_cw, 2)}
                        icon={BookOpen}
                        color="amber"
                    />
                    <StatCard
                        title="Net CW"
                        value={formatNumber(kpi.net_cw, 2)}
                        icon={LandPlot}
                        color="orange"
                    />
                    <StatCard
                        title="Trucks"
                        value={formatNumber(kpi.trucks, 0)}
                        icon={Clipboard}
                        color="blue"
                    />
                    <StatCard
                        title="Actual LKG"
                        value={formatNumber(kpi.actual_lkg, 2)}
                        icon={Clipboard}
                        color="teal"
                    />
                    <StatCard
                        title="Pshr Net LKG"
                        value={formatNumber(kpi.pshr_net_lkg, 2)}
                        icon={Clipboard}
                        color="indigo"
                    />
                    <StatCard
                        title="Actual Mol"
                        value={formatNumber(kpi.actual_mol, 2)}
                        icon={Clipboard}
                        color="gray"
                    />
                    <StatCard
                        title="Pshr Net Mol"
                        value={formatNumber(kpi.pshr_net_mol, 2)}
                        icon={Clipboard}
                        color="brown"
                    />
                    <StatCard
                        title="Distinct Planters"
                        value={formatNumber(entity_counts.planters, 0)}
                        icon={User}
                        color="green"
                    />
                    <StatCard
                        title="Distinct Haciendas"
                        value={formatNumber(entity_counts.haciendas, 0)}
                        icon={LandPlot}
                        color="purple"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 2xl:grid-cols-2">
                <Container>
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
                                        {formatNumber(
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
            </div>

            <Container>
                <ContainerHeader>
                    Milling Period Calendar
                    <Button
                        onClick={() => router.get(millingPeriodCreate().url)}
                    >
                        <Plus />
                        Add Week
                    </Button>
                </ContainerHeader>
                <MillingPeriodsCalendar events={calendarEvents} />
            </Container>
        </AppLayout>
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
