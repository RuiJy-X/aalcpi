export type WeeklyRecord = {
    id: number;
    crop_year: string;
    week: string;
    planter_name: string;
    planter_code: string;
    segment: string;
    page: string;
    file_location: string;
    preview_url: string;
    download_url: string;
    created_at: string | null;
};

export type WeeklyPlanterGroup = {
    planter_code: string;
    planter_name: string;
    crop_years: string[];
    weeks: string[];
    files: WeeklyRecord[];
    file_count: number;
};

export type WeeklyStatsData = {
    totalDocuments: number;
    uniquePlanters: number;
    uniqueWeeks: number;
    uniqueCropYears: number;
};

export type WeeklyIndexProps = {
    /** One card per planter on the current page; each includes ALL of that planter's filtered PDFs. */
    planter_groups: WeeklyPlanterGroup[];
    crop_years: string[];
    weeks_by_crop_year: Record<string, string[]>;
    /** Pagination is over planters, not individual PDF rows. */
    pagination: {
        total: number;
        per_page: number;
        current_page: number;
        last_page: number;
    };
    table_state?: {
        search?: string;
        crop_year?: string;
        week?: string;
        period_from?: string;
        period_to?: string;
    };
    stats?: WeeklyStatsData;
};
