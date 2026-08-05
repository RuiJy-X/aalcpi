import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    History,
    FileSpreadsheet,
    Trash2,
    CheckCircle2,
    XCircle,
    Clock,
    Search,
    Filter,
    ArrowLeft,
    RefreshCw,
    Building2,
    Database,
    Users,
    FileText,
    FileCheck,
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import {
    Container,
    ContainerHeader,
    ContainerHeaderEnd,
} from '@/components/container';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types';

import {
    ImportSummaryModal,
    type ImportSummaryData,
} from '@/components/import/import-summary-modal';

type ImportJobItem = {
    id: number;
    type: string;
    status: 'queued' | 'running' | 'done' | 'failed';
    message: string | null;
    file_name: string;
    created_at: string;
    user_name: string;
    record_count: number;
    context?: Record<string, unknown>;
};

type PaginationProps = {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
};

type HistoryProps = {
    jobs: ImportJobItem[];
    pagination: PaginationProps;
    filters: {
        type: string;
        status: string;
        search: string;
    };
    stats: {
        total: number;
        done: number;
        failed: number;
        running: number;
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Import History', href: '/Imports/history' },
];

export default function ImportHistoryPage({
    jobs,
    pagination,
    filters,
    stats,
}: HistoryProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [selectedType, setSelectedType] = useState(filters.type || 'all');
    const [selectedStatus, setSelectedStatus] = useState(
        filters.status || 'all',
    );
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const [selectedSummary, setSelectedSummary] =
        useState<ImportSummaryData | null>(null);
    const [isSummaryOpen, setIsSummaryOpen] = useState(false);

    const handleViewSummary = (job: ImportJobItem) => {
        setSelectedSummary({
            id: job.id,
            type: job.type,
            status: job.status,
            message: job.message,
            context: job.context,
        });
        setIsSummaryOpen(true);
    };

    const applyFilters = (newFilters: {
        type?: string;
        status?: string;
        search?: string;
    }) => {
        const queryParams: Record<string, string> = {};

        const typeVal =
            newFilters.type !== undefined ? newFilters.type : selectedType;
        const statusVal =
            newFilters.status !== undefined
                ? newFilters.status
                : selectedStatus;
        const searchVal =
            newFilters.search !== undefined ? newFilters.search : search;

        if (typeVal && typeVal !== 'all') queryParams.type = typeVal;
        if (statusVal && statusVal !== 'all') queryParams.status = statusVal;
        if (searchVal.trim() !== '') queryParams.search = searchVal.trim();

        router.get('/Imports/history', queryParams, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const handleDeleteJob = (jobId: number, fileName: string) => {
        if (
            !confirm(
                `Are you sure you want to delete the import "${fileName}"?\n\nAll records created by this file import will be permanently removed.`,
            )
        ) {
            return;
        }

        setDeletingId(jobId);
        router.delete(`/Imports/history/${jobId}`, {
            preserveScroll: true,
            onFinish: () => setDeletingId(null),
        });
    };

    const formatTypeName = (type: string) => {
        switch (type) {
            case 'bank_recon_internal':
            case 'internal':
                return 'Internal Ledger';
            case 'bank_recon_bank':
            case 'bank':
                return 'Bank Statement';
            case 'planters':
                return 'Planter Data';
            case 'productions':
                return 'Production Data';
            case 'weekly':
                return 'Weekly Report';
            default:
                return type;
        }
    };

    const getTypeIcon = (type: string) => {
        if (type.includes('internal'))
            return <Building2 className="h-4 w-4 text-primary" />;
        if (type.includes('bank'))
            return <FileSpreadsheet className="h-4 w-4 text-emerald-500" />;
        if (type === 'planters')
            return <Users className="h-4 w-4 text-amber-500" />;
        return <Database className="h-4 w-4 text-blue-500" />;
    };

    const formatDate = (iso: string) => {
        if (!iso) return 'N/A';
        const d = new Date(iso);
        return d.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Import History Log" />

            <div className="space-y-6 p-6">
                {/* Top Header Card & Quick Stats */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-foreground">
                            <History className="h-7 w-7 text-primary" />
                            Import History Log
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Track all spreadsheet uploads, monitor background
                            processing, and safely revert specific import
                            batches.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.history.back()}
                            className="gap-1.5"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => applyFilters({})}
                            className="gap-1.5"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Refresh Log
                        </Button>
                    </div>
                </div>

                {/* KPI Metrics Dashboard */}
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <Card className="border-muted bg-card/50 shadow-sm backdrop-blur-sm">
                        <CardContent className="flex items-center justify-between p-4">
                            <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase">
                                    Total Imports
                                </p>
                                <p className="mt-1 text-2xl font-bold text-foreground">
                                    {stats.total}
                                </p>
                            </div>
                            <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                                <FileText className="h-5 w-5" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-muted bg-card/50 shadow-sm backdrop-blur-sm">
                        <CardContent className="flex items-center justify-between p-4">
                            <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase">
                                    Completed
                                </p>
                                <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                    {stats.done}
                                </p>
                            </div>
                            <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="h-5 w-5" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-muted bg-card/50 shadow-sm backdrop-blur-sm">
                        <CardContent className="flex items-center justify-between p-4">
                            <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase">
                                    Processing
                                </p>
                                <p className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">
                                    {stats.running}
                                </p>
                            </div>
                            <div className="rounded-xl bg-amber-500/10 p-2.5 text-amber-600 dark:text-amber-400">
                                <Clock className="h-5 w-5" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-muted bg-card/50 shadow-sm backdrop-blur-sm">
                        <CardContent className="flex items-center justify-between p-4">
                            <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase">
                                    Failed
                                </p>
                                <p className="mt-1 text-2xl font-bold text-destructive">
                                    {stats.failed}
                                </p>
                            </div>
                            <div className="rounded-xl bg-destructive/10 p-2.5 text-destructive">
                                <XCircle className="h-5 w-5" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filter Controls Bar */}
                <Container>
                    <div className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex max-w-md flex-1 items-center gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Search by file name or log message..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter')
                                            applyFilters({ search });
                                    }}
                                    className="pl-9"
                                />
                            </div>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => applyFilters({ search })}
                            >
                                Search
                            </Button>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4 text-muted-foreground" />
                                <span className="text-xs font-medium text-muted-foreground">
                                    Module:
                                </span>
                                <Select
                                    value={selectedType}
                                    onValueChange={(val) => {
                                        setSelectedType(val);
                                        applyFilters({ type: val });
                                    }}
                                >
                                    <SelectTrigger className="h-9 w-[180px] text-xs">
                                        <SelectValue placeholder="All Modules" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            All Modules
                                        </SelectItem>
                                        <SelectItem value="bank_recon">
                                            Bank Reconciliation
                                        </SelectItem>
                                        <SelectItem value="planters">
                                            Planter Data
                                        </SelectItem>
                                        <SelectItem value="productions">
                                            Production Data
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-muted-foreground">
                                    Status:
                                </span>
                                <Select
                                    value={selectedStatus}
                                    onValueChange={(val) => {
                                        setSelectedStatus(val);
                                        applyFilters({ status: val });
                                    }}
                                >
                                    <SelectTrigger className="h-9 w-[140px] text-xs">
                                        <SelectValue placeholder="All Statuses" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            All Statuses
                                        </SelectItem>
                                        <SelectItem value="done">
                                            Completed
                                        </SelectItem>
                                        <SelectItem value="failed">
                                            Failed
                                        </SelectItem>
                                        <SelectItem value="running">
                                            Processing
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Import Log Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b bg-muted/50 text-xs font-semibold text-muted-foreground uppercase">
                                <tr>
                                    <th className="px-4 py-3.5">
                                        File Name & Type
                                    </th>
                                    <th className="px-4 py-3.5">Imported At</th>
                                    <th className="px-4 py-3.5">User</th>
                                    <th className="px-4 py-3.5">Records</th>
                                    <th className="px-4 py-3.5">Status</th>
                                    <th className="px-4 py-3.5 text-right">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y border-b">
                                {jobs.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="py-12 text-center text-muted-foreground"
                                        >
                                            <FileSpreadsheet className="mx-auto mb-2 h-10 w-10 text-muted-foreground/40" />
                                            <p className="text-base font-medium">
                                                No import history found
                                            </p>
                                            <p className="mt-1 text-xs">
                                                Try adjusting your filters or
                                                upload a new spreadsheet
                                                dataset.
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    jobs.map((job) => (
                                        <tr
                                            key={job.id}
                                            className="transition-colors hover:bg-muted/30"
                                        >
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="rounded-lg bg-accent/60 p-2">
                                                        {getTypeIcon(job.type)}
                                                    </div>
                                                    <div>
                                                        <p className="max-w-xs truncate font-semibold text-foreground">
                                                            {job.file_name}
                                                        </p>
                                                        <p className="mt-0.5 text-xs text-muted-foreground">
                                                            {formatTypeName(
                                                                job.type,
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-4 py-4 text-xs whitespace-nowrap text-muted-foreground">
                                                {formatDate(job.created_at)}
                                            </td>

                                            <td className="px-4 py-4 text-xs font-medium whitespace-nowrap text-foreground">
                                                {job.user_name}
                                            </td>

                                            <td className="px-4 py-4 text-xs font-semibold whitespace-nowrap">
                                                <span className="inline-flex items-center rounded-md bg-secondary px-2.5 py-1 text-secondary-foreground">
                                                    {job.record_count.toLocaleString()}{' '}
                                                    rows
                                                </span>
                                            </td>

                                            <td className="px-4 py-4 text-xs whitespace-nowrap">
                                                {job.status === 'done' && (
                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 font-medium text-emerald-600 dark:text-emerald-400">
                                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                                        Completed
                                                    </span>
                                                )}
                                                {job.status === 'failed' && (
                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-1 font-medium text-destructive">
                                                        <XCircle className="h-3.5 w-3.5" />
                                                        Failed
                                                    </span>
                                                )}
                                                {(job.status === 'running' ||
                                                    job.status ===
                                                        'queued') && (
                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 font-medium text-amber-600 dark:text-amber-400">
                                                        <Clock className="h-3.5 w-3.5 animate-spin" />
                                                        Processing
                                                    </span>
                                                )}
                                                {job.message && (
                                                    <p
                                                        className="mt-1 max-w-xs truncate text-[11px] text-muted-foreground"
                                                        title={job.message}
                                                    >
                                                        {job.message}
                                                    </p>
                                                )}
                                            </td>

                                            <td className="space-x-1 px-4 py-4 text-right whitespace-nowrap">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        handleViewSummary(job)
                                                    }
                                                    className="gap-1.5"
                                                >
                                                    <FileCheck className="h-4 w-4 text-primary" />
                                                    <span className="text-xs font-medium">
                                                        Audit Report
                                                    </span>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        handleDeleteJob(
                                                            job.id,
                                                            job.file_name,
                                                        )
                                                    }
                                                    disabled={
                                                        deletingId === job.id
                                                    }
                                                    className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                >
                                                    {deletingId === job.id ? (
                                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="h-4 w-4" />
                                                    )}
                                                    <span className="text-xs font-medium">
                                                        Revert Import
                                                    </span>
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Container>
            </div>

            <ImportSummaryModal
                isOpen={isSummaryOpen}
                onClose={() => setIsSummaryOpen(false)}
                summary={selectedSummary}
            />
        </AppLayout>
    );
}
