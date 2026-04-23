import { Head, router } from '@inertiajs/react';
import { useMemo } from 'react';
import {
    Container,
    ContainerHeader,
    ContainerHeaderEnd,
} from '@/components/container';
import { DataTable } from '@/components/data-table/data-table';
import type { ProductionRow } from '@/components/planters/planters-table-types';
import { distributionColumns } from '@/components/productions/distribution-columns';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { index as distributionsIndex } from '@/routes/distributions';
import { show as productionShow } from '@/routes/productions';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Financial Distributions',
        href: distributionsIndex().url,
    },
];

const statusLabelMap: Record<string, string> = {
    pending_price: 'Pending Price',
    calculated_pending_review: 'Calculated / Pending Review',
    accepted: 'Accepted',
};

export default function Index({
    productions,
    crop_years,
    weeks_by_crop_year,
    status_options,
    filters,
}: {
    productions: ProductionRow[];
    crop_years: string[];
    weeks_by_crop_year: Record<string, number[]>;
    status_options: string[];
    filters: {
        crop_year?: string;
        week_no?: string;
        financial_status?: string;
    };
}) {
    const selectedCropYear =
        filters?.crop_year && filters.crop_year !== ''
            ? filters.crop_year
            : 'all';
    const selectedWeekNo =
        filters?.week_no && filters.week_no !== '' ? filters.week_no : 'all';
    const selectedStatus =
        filters?.financial_status && filters.financial_status !== ''
            ? filters.financial_status
            : 'all';

    const weekOptions =
        selectedCropYear === 'all'
            ? []
            : (weeks_by_crop_year[selectedCropYear] ?? []);

    const pendingReviewCount = useMemo(
        () =>
            productions.filter(
                (production) =>
                    production.financial_status === 'calculated_pending_review',
            ).length,
        [productions],
    );

    const applyFilters = (
        cropYear: string,
        weekNo: string,
        financialStatus: string,
    ) => {
        const query: Record<string, string> = {};

        if (cropYear !== 'all') {
            query.crop_year = cropYear;
        }

        if (weekNo !== 'all') {
            query.week_no = weekNo;
        }

        if (financialStatus !== 'all') {
            query.financial_status = financialStatus;
        }

        router.get(distributionsIndex().url, query, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Financial Distributions" />

            {pendingReviewCount > 0 && (
                <div className="mx-3 mt-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    {pendingReviewCount} production records have been updated
                    with the new weekly auction price. Please review and accept
                    the totals.
                </div>
            )}

            <Container>
                <ContainerHeader>
                    Financial Distribution Review
                    <ContainerHeaderEnd>
                        <div className="flex items-center gap-2">
                            <Select
                                value={selectedCropYear}
                                onValueChange={(nextCropYear) =>
                                    applyFilters(
                                        nextCropYear,
                                        'all',
                                        selectedStatus,
                                    )
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
                                    applyFilters(
                                        selectedCropYear,
                                        nextWeekNo,
                                        selectedStatus,
                                    )
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

                            <Select
                                value={selectedStatus}
                                onValueChange={(nextStatus) =>
                                    applyFilters(
                                        selectedCropYear,
                                        selectedWeekNo,
                                        nextStatus,
                                    )
                                }
                            >
                                <SelectTrigger className="w-56">
                                    <SelectValue placeholder="Financial Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        All Statuses
                                    </SelectItem>
                                    {status_options.map((status) => (
                                        <SelectItem key={status} value={status}>
                                            {statusLabelMap[status] ?? status}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </ContainerHeaderEnd>
                </ContainerHeader>

                <DataTable
                    columns={distributionColumns}
                    data={productions}
                    onRowDoubleClick={(production) =>
                        productionShow(production.id).url
                    }
                />
            </Container>
        </AppLayout>
    );
}
