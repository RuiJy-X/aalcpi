import { Head, router } from '@inertiajs/react';

import { productionBulkDelete } from '@/components/data-table/bulk-delete';
import { productionBulkDownload } from '@/components/data-table/bulk-download';
import { DataTable } from '@/components/data-table/data-table';

import { productionColumns } from '@/components/data-table/production-columns';
import { productionYearlyColumns } from '@/components/productions/production-yearly-columns';
import type { ProductionRow } from '@/components/planters/planters-table-types';
// import PlantersTabsTable from '@/components/planters/planters-tabs-table';
import ProductionStats from '@/components/productions/stat-cards/ProductionStats';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { index as productionsIndex } from '@/routes/productions';
import { show as productionShow } from '@/routes/productions';
import type { BreadcrumbItem } from '@/types';
import { ImportDialog } from '@/components/import/import-dialog';
import { productionsImportConfig } from '@/components/import/import-config';
import {
    Container,
    ContainerHeader,
    ContainerHeaderEnd,
} from '@/components/container';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Production Management',
        href: productionsIndex().url,
    },
];

export default function Index({
    productions,
    crop_years,
    weeks_by_crop_year,
    filters,
}: {
    productions: ProductionRow[];
    crop_years: string[];
    weeks_by_crop_year: Record<string, number[]>;
    filters: {
        crop_year?: string;
        week_no?: string;
        view_mode?: 'weekly' | 'yearly';
    };
}) {
    const selectedCropYear =
        filters?.crop_year && filters.crop_year !== ''
            ? filters.crop_year
            : 'all';
    const selectedWeekNo =
        filters?.week_no && filters.week_no !== '' ? filters.week_no : 'all';

    const weekOptions =
        selectedCropYear === 'all'
            ? []
            : (weeks_by_crop_year[selectedCropYear] ?? []);

    const selectedViewMode =
        filters?.view_mode === 'yearly' ? 'yearly' : 'weekly';

    const [activeTab, setActiveTab] = useState<'weekly' | 'yearly'>(
        selectedViewMode,
    );
    const isYearly = activeTab === 'yearly';

    const applyFilters = (
        cropYear: string,
        weekNo: string,
        viewMode: 'weekly' | 'yearly' = activeTab,
    ) => {
        const query: Record<string, string> = {};

        if (cropYear !== 'all') {
            query.crop_year = cropYear;
        }

        if (weekNo !== 'all' && viewMode !== 'yearly') {
            query.week_no = weekNo;
        }

        query.view_mode = viewMode;

        router.get(productionsIndex().url, query, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const tableColumns = isYearly ? productionYearlyColumns : productionColumns;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Productions"></Head>

            <div className="flex gap-2 overflow-x-auto p-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <ProductionStats productions={productions} />
            </div>

            <div className="mx-3 flex gap-2">
                <Tabs
                    value={activeTab}
                    defaultValue="weekly"
                    className="w-fit"
                    onValueChange={(nextTab) => {
                        const tab = nextTab === 'yearly' ? 'yearly' : 'weekly';
                        setActiveTab(tab);
                        applyFilters(
                            selectedCropYear,
                            tab === 'yearly' ? 'all' : selectedWeekNo,
                            tab,
                        );
                    }}
                >
                    <TabsList className="" variant="line">
                        <TabsTrigger value="weekly">Weekly</TabsTrigger>
                        <TabsTrigger value="yearly">Yearly</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            <Container>
                <ContainerHeader>
                    Productions Table
                    <ContainerHeaderEnd>
                        <div className="flex items-center gap-2">
                            <Select
                                value={selectedCropYear}
                                onValueChange={(nextCropYear) =>
                                    applyFilters(nextCropYear, 'all', activeTab)
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
                                        activeTab,
                                    )
                                }
                                disabled={
                                    selectedCropYear === 'all' || isYearly
                                }
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
                        <ImportDialog config={productionsImportConfig} />
                    </ContainerHeaderEnd>
                </ContainerHeader>

                <DataTable
                    columns={tableColumns}
                    data={productions}
                    bulkDownload={isYearly ? undefined : productionBulkDownload}
                    bulkDelete={isYearly ? undefined : productionBulkDelete}
                    onRowDoubleClick={
                        isYearly
                            ? undefined
                            : (production) => productionShow(production.id).url
                    }
                />
            </Container>
        </AppLayout>
    );
}
