import { useState } from 'react';
import { ProductionRow } from '../planters-table-types';
import {
    Container,
    ContainerHeader,
    ContainerHeaderEnd,
} from '@/components/container';
import { DataTable } from '@/components/data-table/data-table';
import { productionColumns } from '@/components/data-table/production-columns';
import { productionBulkDelete } from '@/components/data-table/bulk-delete';
import { show as productionShow } from '@/routes/productions';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { productionBulkDownload } from '@/components/data-table/bulk-download';
import { productionsImportConfig } from '@/components/import/import-config';
import { ImportDialog } from '@/components/import/import-dialog';
import { productionYearlyColumns } from '@/components/productions/production-yearly-columns';
import { router } from '@inertiajs/react';

import { show as planterShow } from '@/routes/planters';

const PlanterViewProductions = ({
    productions,
    crop_years,
    weeks_by_crop_year,
    filters,
    planter_id,
}: {
    productions: ProductionRow[];
    crop_years: string[];
    weeks_by_crop_year: Record<string, number[]>;
    filters: {
        crop_year: string;
        week_no: string;
        view_mode: string;
    };
    planter_id: string;
}) => {
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

        router.get(planterShow(planter_id).url, query, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const tableColumns = isYearly ? productionYearlyColumns : productionColumns;

    return (
        <div>
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
        </div>
    );
};

export default PlanterViewProductions;
