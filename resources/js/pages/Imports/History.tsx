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
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Container, ContainerHeader, ContainerHeaderEnd } from '@/components/container';
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

export default function ImportHistoryPage({ jobs, pagination, filters, stats }: HistoryProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [selectedType, setSelectedType] = useState(filters.type || 'all');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || 'all');
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const applyFilters = (newFilters: { type?: string; status?: string; search?: string }) => {
        const queryParams: Record<string, string> = {};

        const typeVal = newFilters.type !== undefined ? newFilters.type : selectedType;
        const statusVal = newFilters.status !== undefined ? newFilters.status : selectedStatus;
        const searchVal = newFilters.search !== undefined ? newFilters.search : search;

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
        if (type.includes('internal')) return <Building2 className="h-4 w-4 text-primary" />;
        if (type.includes('bank')) return <FileSpreadsheet className="h-4 w-4 text-emerald-500" />;
        if (type === 'planters') return <Users className="h-4 w-4 text-amber-500" />;
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
                        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
                            <History className="h-7 w-7 text-primary" />
                            Import History Log
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Track all spreadsheet uploads, monitor background processing, and safely revert specific import batches.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => window.history.back()} className="gap-1.5">
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
                    <Card className="bg-card/50 backdrop-blur-sm border-muted shadow-sm">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase text-muted-foreground">Total Imports</p>
                                <p className="text-2xl font-bold mt-1 text-foreground">{stats.total}</p>
                            </div>
                            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                                <FileText className="h-5 w-5" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-card/50 backdrop-blur-sm border-muted shadow-sm">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase text-muted-foreground">Completed</p>
                                <p className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">{stats.done}</p>
                            </div>
                            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="h-5 w-5" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-card/50 backdrop-blur-sm border-muted shadow-sm">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase text-muted-foreground">Processing</p>
                                <p className="text-2xl font-bold mt-1 text-amber-600 dark:text-amber-400">{stats.running}</p>
                            </div>
                            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                <Clock className="h-5 w-5" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-card/50 backdrop-blur-sm border-muted shadow-sm">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase text-muted-foreground">Failed</p>
                                <p className="text-2xl font-bold mt-1 text-destructive">{stats.failed}</p>
                            </div>
                            <div className="p-2.5 rounded-xl bg-destructive/10 text-destructive">
                                <XCircle className="h-5 w-5" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filter Controls Bar */}
                <Container>
                    <div className="p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b">
                        <div className="flex flex-1 items-center gap-3 max-w-md">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by file name or log message..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') applyFilters({ search });
                                    }}
                                    className="pl-9"
                                />
                            </div>
                            <Button variant="secondary" size="sm" onClick={() => applyFilters({ search })}>
                                Search
                            </Button>
                        </div>

                        <div className="flex items-center gap-3 flex-wrap">
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4 text-muted-foreground" />
                                <span className="text-xs font-medium text-muted-foreground">Module:</span>
                                <Select
                                    value={selectedType}
                                    onValueChange={(val) => {
                                        setSelectedType(val);
                                        applyFilters({ type: val });
                                    }}
                                >
                                    <SelectTrigger className="w-[180px] h-9 text-xs">
                                        <SelectValue placeholder="All Modules" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Modules</SelectItem>
                                        <SelectItem value="bank_recon">Bank Reconciliation</SelectItem>
                                        <SelectItem value="planters">Planter Data</SelectItem>
                                        <SelectItem value="productions">Production Data</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-muted-foreground">Status:</span>
                                <Select
                                    value={selectedStatus}
                                    onValueChange={(val) => {
                                        setSelectedStatus(val);
                                        applyFilters({ status: val });
                                    }}
                                >
                                    <SelectTrigger className="w-[140px] h-9 text-xs">
                                        <SelectValue placeholder="All Statuses" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Statuses</SelectItem>
                                        <SelectItem value="done">Completed</SelectItem>
                                        <SelectItem value="failed">Failed</SelectItem>
                                        <SelectItem value="running">Processing</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Import Log Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-muted/50 text-xs uppercase font-semibold text-muted-foreground border-b">
                                <tr>
                                    <th className="px-4 py-3.5">File Name & Type</th>
                                    <th className="px-4 py-3.5">Imported At</th>
                                    <th className="px-4 py-3.5">User</th>
                                    <th className="px-4 py-3.5">Records</th>
                                    <th className="px-4 py-3.5">Status</th>
                                    <th className="px-4 py-3.5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y border-b">
                                {jobs.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center text-muted-foreground">
                                            <FileSpreadsheet className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
                                            <p className="font-medium text-base">No import history found</p>
                                            <p className="text-xs mt-1">Try adjusting your filters or upload a new spreadsheet dataset.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    jobs.map((job) => (
                                        <tr key={job.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-lg bg-accent/60">
                                                        {getTypeIcon(job.type)}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-foreground max-w-xs truncate">
                                                            {job.file_name}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground mt-0.5">
                                                            {formatTypeName(job.type)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-4 py-4 whitespace-nowrap text-xs text-muted-foreground">
                                                {formatDate(job.created_at)}
                                            </td>

                                            <td className="px-4 py-4 whitespace-nowrap text-xs font-medium text-foreground">
                                                {job.user_name}
                                            </td>

                                            <td className="px-4 py-4 whitespace-nowrap text-xs font-semibold">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-secondary text-secondary-foreground">
                                                    {job.record_count.toLocaleString()} rows
                                                </span>
                                            </td>

                                            <td className="px-4 py-4 whitespace-nowrap text-xs">
                                                {job.status === 'done' && (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                                        Completed
                                                    </span>
                                                )}
                                                {job.status === 'failed' && (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium bg-destructive/10 text-destructive">
                                                        <XCircle className="h-3.5 w-3.5" />
                                                        Failed
                                                    </span>
                                                )}
                                                {(job.status === 'running' || job.status === 'queued') && (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                                        <Clock className="h-3.5 w-3.5 animate-spin" />
                                                        Processing
                                                    </span>
                                                )}
                                                {job.message && (
                                                    <p className="text-[11px] text-muted-foreground mt-1 max-w-xs truncate" title={job.message}>
                                                        {job.message}
                                                    </p>
                                                )}
                                            </td>

                                            <td className="px-4 py-4 whitespace-nowrap text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDeleteJob(job.id, job.file_name)}
                                                    disabled={deletingId === job.id}
                                                    className="text-destructive hover:bg-destructive/10 hover:text-destructive gap-1.5"
                                                >
                                                    {deletingId === job.id ? (
                                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="h-4 w-4" />
                                                    )}
                                                    <span className="text-xs font-medium">Revert Import</span>
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
        </AppLayout>
    );
}
