import { Head } from '@inertiajs/react';
import { DataTable } from '@/components/data-table/data-table';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import {
    Container,
    ContainerHeader,
    ContainerHeaderEnd,
} from '@/components/container';
import { millingPeriodColumns } from '@/components/milling-periods/milling-periods-columns';
import type { MillingPeriodRow } from '@/components/milling-periods/milling-periods-types';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Plus } from 'lucide-react';
import {
    create as millingPeriodCreate,
    index as millingPeriodIndex,
    show as millingPeriodShow,
} from '@/routes/milling-periods';
import { router } from '@inertiajs/react';
import { millingPeriodBulkDelete } from '@/components/data-table/bulk-delete';
import type { EventInput } from '@fullcalendar/core';
import MillingPeriodsCalendar from '@/components/milling-periods/milling-periods-calendar';
import MillingPeriodStats, {
    type MillingPeriodStatsData,
} from '@/components/milling-periods/stat-cards/MillingPeriodStats';
import { KpiOverview } from '@/components/kpi/kpi-card';
import {
    PeriodFilterBar,
    formatPeriodLabel,
} from '@/components/period-filter-bar';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Milling Periods Management',
        href: '#',
    },
];

export default function Index({
    milling_periods,
    crop_years,
    weeks_by_crop_year,
    filters,
    stats = {
        totalPeriods: 0,
        activeNow: 0,
        avgSugarPrice: 0,
        avgMolPrice: 0,
        cropYearsCount: 0,
    },
}: {
    milling_periods: MillingPeriodRow[];
    crop_years: string[];
    weeks_by_crop_year: Record<string, number[]>;
    filters: {
        crop_year?: string;
        week_no?: string;
        period_from?: string;
        period_to?: string;
    };
    stats?: MillingPeriodStatsData;
}) {
    const selectedCropYear =
        filters?.crop_year && filters.crop_year !== ''
            ? filters.crop_year
            : 'all';
    const selectedWeekNo =
        filters?.week_no && filters.week_no !== '' ? filters.week_no : 'all';

    const [periodRange, setPeriodRange] = useState<DateRange | undefined>(
        filters?.period_from
            ? {
                  from: new Date(filters.period_from),
                  to: filters.period_to
                      ? new Date(filters.period_to)
                      : undefined,
              }
            : undefined,
    );

    const weekOptions =
        selectedCropYear === 'all'
            ? []
            : (weeks_by_crop_year[selectedCropYear] ?? []);

    const buildQuery = (
        cropYear: string,
        weekNo: string,
        period: DateRange | undefined = periodRange,
    ) => {
        const query: Record<string, string> = {};

        if (cropYear !== 'all') {
            query.crop_year = cropYear;
        }

        if (weekNo !== 'all') {
            query.week_no = weekNo;
        }

        if (period?.from) {
            query.period_from = format(period.from, 'yyyy-MM-dd');
            if (period.to) {
                query.period_to = format(period.to, 'yyyy-MM-dd');
            }
        }

        return query;
    };

    const applyFilters = (cropYear: string, weekNo: string) => {
        router.get(millingPeriodIndex().url, buildQuery(cropYear, weekNo), {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const applyPeriodFilter = (nextPeriod: DateRange | undefined) => {
        setPeriodRange(nextPeriod);
        router.get(
            millingPeriodIndex().url,
            buildQuery(selectedCropYear, selectedWeekNo, nextPeriod),
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    const calendarEvents = useMemo<EventInput[]>(() => {
        return milling_periods.map((period) => ({
            id: String(period.id),
            title: `Week ${period.week_no} (${period.crop_year}) -  ₱/LKG: ${Number(period.sugar_price).toFixed(2)},  ₱/MOL: ${Number(period.mol_price).toFixed(2)}`,
            start: period.start_date,
            end: period.end_date,
            allDay: true,
            extendedProps: {
                sugar_factor: period.sugar_factor,
                mol_factor: period.mol_factor,
            },
        }));
    }, [milling_periods]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Milling Periods"></Head>

            <PeriodFilterBar value={periodRange} onChange={applyPeriodFilter} />

            <KpiOverview periodLabel={formatPeriodLabel(periodRange)}>
                <MillingPeriodStats stats={stats} />
            </KpiOverview>

            <Container>
                <ContainerHeader>
                    Milling Periods Calendar
                    <ContainerHeaderEnd>
                        <Button
                            onClick={() =>
                                router.get(millingPeriodCreate().url)
                            }
                        >
                            <Plus />
                            Add Week
                        </Button>
                    </ContainerHeaderEnd>
                </ContainerHeader>

                <MillingPeriodsCalendar
                    events={calendarEvents}
                    onEventClick={(info) => {
                        router.get(millingPeriodShow(info.event.id).url);
                    }}
                />
            </Container>
            <Container>
                <ContainerHeader>
                    Milling Periods Table
                    <ContainerHeaderEnd>
                        <div className="flex items-center gap-2">
                            <Select
                                value={selectedCropYear}
                                onValueChange={(nextCropYear) =>
                                    applyFilters(nextCropYear, 'all')
                                }
                            >
                                <SelectTrigger className="w-44">
                                    <SelectValue placeholder="Crop Year" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        All Crop Years
                                    </SelectItem>
                                    {crop_years.map((cropYear) => (
                                        <SelectItem
                                            key={cropYear}
                                            value={cropYear}
                                        >
                                            {cropYear}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select
                                value={selectedWeekNo}
                                onValueChange={(nextWeekNo) =>
                                    applyFilters(selectedCropYear, nextWeekNo)
                                }
                                disabled={selectedCropYear === 'all'}
                            >
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="Week No." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        All Weeks
                                    </SelectItem>
                                    {weekOptions.map((weekNo) => {
                                        const weekValue = String(weekNo);

                                        return (
                                            <SelectItem
                                                key={weekValue}
                                                value={weekValue}
                                            >
                                                Week {weekValue}
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button
                            onClick={() =>
                                router.get(millingPeriodCreate().url)
                            }
                        >
                            <Plus />
                            Add
                        </Button>
                    </ContainerHeaderEnd>
                </ContainerHeader>
                <DataTable
                    onRowDoubleClick={(milling_period) =>
                        millingPeriodShow(milling_period.id).url
                    }
                    bulkDelete={millingPeriodBulkDelete}
                    data={milling_periods}
                    columns={millingPeriodColumns}
                    excludedDateFilterColumns={['start_date', 'end_date']}
                ></DataTable>
            </Container>
        </AppLayout>
    );
}
