import { Head } from '@inertiajs/react';
import { useRef, useState, type ChangeEvent } from 'react';
import {
    Clock3,
    FileSpreadsheet,
    FlaskConical,
    HandCoins,
    LoaderCircle,
    Search,
    TrendingUp,
    Truck,
    Wallet,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

type DashboardProps = {
    seasonYear: number;
    kpis: {
        totalMilledCw: number;
        truckCount: number;
        totalActualLkg: number;
        totalTheoreticalLkg: number;
        efficiencyRate: number;
        planterDistributionsLkg: number;
        associationDuesLkg: number;
        associationDuesMol: number;
        actualMol: number;
        pshrNetMol: number;
    };
    certificationPipeline: Array<{
        label: string;
        pending: number;
    }>;
};

const formatCw = (value: number) =>
    `${value.toLocaleString(undefined, { maximumFractionDigits: 1 })} CW`;

const formatLkg = (value: number) => `${value.toLocaleString()} LKG`;

const formatMol = (value: number) => `${value.toLocaleString()} MOL`;

function ProgressBar({ value }: { value: number }) {
    const clamped = Math.max(0, Math.min(100, value));

    return (
        <div className="h-2.5 w-full rounded-full bg-slate-200/70 dark:bg-slate-800">
            <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500 transition-all"
                style={{ width: `${clamped}%` }}
            />
        </div>
    );
}

export default function Dashboard({
    seasonYear,
    kpis,
    certificationPipeline,
}: DashboardProps) {
    const [query, setQuery] = useState('');
    const [isImporting, setIsImporting] = useState(false);
    const [selectedImportFile, setSelectedImportFile] = useState<string | null>(
        null,
    );
    const fileInputRef = useRef<HTMLInputElement>(null);

    const molUtilization =
        kpis.actualMol === 0 ? 0 : (kpis.pshrNetMol / kpis.actualMol) * 100;

    const filteredPipeline = certificationPipeline.filter((item) =>
        item.label.toLowerCase().includes(query.toLowerCase()),
    );

    const onImportClick = () => {
        setIsImporting(true);
        fileInputRef.current?.click();
    };

    const onImportFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (!file) {
            setIsImporting(false);
            return;
        }

        setSelectedImportFile(file.name);

        window.setTimeout(() => {
            setIsImporting(false);
        }, 900);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-5 overflow-x-auto rounded-xl bg-gradient-to-br from-slate-100 via-blue-50 to-emerald-50 p-4 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
                <section className="rounded-2xl border border-slate-300/80 bg-white/85 p-4 shadow-xl shadow-slate-900/5 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/80">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <p className="text-xs tracking-[0.24em] text-slate-500 uppercase">
                                AALCPI Milling Command Center
                            </p>
                            <h1 className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                                Current Milling Season Dashboard
                            </h1>
                            <p className="text-sm text-slate-600 dark:text-slate-300">
                                Season {seasonYear}: from weigh-bridge Gross CW
                                to planter PSHR Net LKG.
                            </p>
                        </div>

                        <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
                            <div className="relative w-full sm:w-96">
                                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-500" />
                                <Input
                                    value={query}
                                    onChange={(event) =>
                                        setQuery(event.target.value)
                                    }
                                    placeholder="Search certification type"
                                    className="h-10 border-slate-300 bg-white pl-9 dark:border-slate-700 dark:bg-slate-900"
                                />
                            </div>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx"
                                onChange={onImportFileChange}
                                className="hidden"
                            />

                            <Button
                                onClick={onImportClick}
                                className="bg-blue-600 text-white hover:bg-blue-500"
                            >
                                {isImporting ? (
                                    <LoaderCircle className="size-4 animate-spin" />
                                ) : (
                                    <FileSpreadsheet className="size-4" />
                                )}
                                {isImporting ? 'Uploading .xlsx...' : 'Import'}
                            </Button>
                        </div>
                    </div>

                    {selectedImportFile ? (
                        <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-emerald-300/70 bg-emerald-50 px-3 py-1.5 text-xs text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-950/20 dark:text-emerald-300">
                            <FileSpreadsheet className="size-3.5" />
                            Loaded import file: {selectedImportFile}
                        </div>
                    ) : null}
                </section>

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <Card className="border-slate-300/70 bg-white/90 dark:border-slate-800 dark:bg-slate-900/80">
                        <CardHeader className="pb-3">
                            <CardDescription>Total Milled (CW)</CardDescription>
                            <CardTitle className="text-2xl text-slate-900 dark:text-slate-100">
                                {formatCw(kpis.totalMilledCw)}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500">
                                    Truck Count
                                </span>
                                <span className="inline-flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-200">
                                    <Truck className="size-4 text-blue-500" />
                                    {kpis.truckCount} trucks
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-300/70 bg-white/90 dark:border-slate-800 dark:bg-slate-900/80">
                        <CardHeader className="pb-3">
                            <CardDescription>
                                Total Production (LKG)
                            </CardDescription>
                            <CardTitle className="text-2xl text-slate-900 dark:text-slate-100">
                                {formatLkg(kpis.totalActualLkg)}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 pt-0">
                            <div className="flex items-center justify-between text-xs text-slate-500">
                                <span>Actual vs Theoretical</span>
                                <span className="font-medium text-slate-700 dark:text-slate-200">
                                    {kpis.efficiencyRate.toFixed(2)}%
                                </span>
                            </div>
                            <ProgressBar value={kpis.efficiencyRate} />
                            <div className="text-xs text-slate-500">
                                Theoretical benchmark:{' '}
                                <span className="font-medium text-slate-700 dark:text-slate-200">
                                    {formatLkg(kpis.totalTheoreticalLkg)}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-300/70 bg-white/90 dark:border-slate-800 dark:bg-slate-900/80">
                        <CardHeader className="pb-3">
                            <CardDescription>
                                Planter Distributions
                            </CardDescription>
                            <CardTitle className="text-2xl text-slate-900 dark:text-slate-100">
                                {formatLkg(kpis.planterDistributionsLkg)}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 text-sm text-slate-500">
                            <div className="flex items-center justify-between">
                                <span>Available for Withdrawal</span>
                                <HandCoins className="size-4 text-emerald-500" />
                            </div>
                            <p className="mt-2 text-xs text-slate-500">
                                Net planter share after PDPA and dues
                                deductions.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-300/70 bg-white/90 dark:border-slate-800 dark:bg-slate-900/80">
                        <CardHeader className="pb-3">
                            <CardDescription>
                                Association Revenue
                            </CardDescription>
                            <CardTitle className="text-2xl text-slate-900 dark:text-slate-100">
                                {formatLkg(kpis.associationDuesLkg)}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 text-sm text-slate-500">
                            <div className="flex items-center justify-between">
                                <span>Dues from LKG</span>
                                <Wallet className="size-4 text-blue-500" />
                            </div>
                            <div className="mt-2 flex items-center justify-between text-xs">
                                <span>Equivalent MOL</span>
                                <span className="font-medium text-slate-700 dark:text-slate-200">
                                    {formatMol(kpis.associationDuesMol)}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                <section className="grid gap-4 xl:grid-cols-2">
                    <Card className="border-slate-300/70 bg-white/90 dark:border-slate-800 dark:bg-slate-900/80">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-slate-900 dark:text-slate-100">
                                Molasses Byproduct Tracker
                            </CardTitle>
                            <CardDescription>
                                Secondary income stream monitoring
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center justify-between rounded-lg border border-slate-300/70 p-3 dark:border-slate-700">
                                <span className="text-sm text-slate-500">
                                    Actual MOL
                                </span>
                                <span className="font-semibold text-slate-800 dark:text-slate-100">
                                    {formatMol(kpis.actualMol)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between rounded-lg border border-slate-300/70 p-3 dark:border-slate-700">
                                <span className="text-sm text-slate-500">
                                    PSHR Net MOL
                                </span>
                                <span className="font-semibold text-slate-800 dark:text-slate-100">
                                    {formatMol(kpis.pshrNetMol)}
                                </span>
                            </div>
                            <div className="text-xs text-slate-500">
                                Net MOL utilization ratio
                            </div>
                            <ProgressBar value={molUtilization} />
                            <div className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                                {molUtilization.toFixed(2)}% utilized
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-300/70 bg-white/90 dark:border-slate-800 dark:bg-slate-900/80">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-slate-900 dark:text-slate-100">
                                Certification Pipeline
                            </CardTitle>
                            <CardDescription>
                                Quick actions for pending documents
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {(query
                                ? filteredPipeline
                                : certificationPipeline
                            ).map((item) => (
                                <div
                                    key={item.label}
                                    className="rounded-lg border border-slate-300/70 p-3 dark:border-slate-700"
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-sm text-slate-600 dark:text-slate-300">
                                            {item.label}
                                        </span>
                                        <Badge
                                            variant="outline"
                                            className="border-amber-300/70 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-900/20 dark:text-amber-300"
                                        >
                                            <Clock3 className="mr-1 size-3" />
                                            {item.pending} pending
                                        </Badge>
                                    </div>
                                </div>
                            ))}

                            <Button className="mt-2 w-full bg-emerald-600 text-white hover:bg-emerald-500">
                                <FlaskConical className="size-4" />
                                Generate All
                            </Button>

                            <Badge
                                variant="outline"
                                className="w-full justify-center border-blue-300/60 bg-blue-50 py-2 text-blue-700 dark:border-blue-500/30 dark:bg-blue-900/20 dark:text-blue-300"
                            >
                                <TrendingUp className="mr-1 size-3.5" />
                                Current season efficiency:{' '}
                                {kpis.efficiencyRate.toFixed(2)}%
                            </Badge>
                        </CardContent>
                    </Card>
                </section>
            </div>
        </AppLayout>
    );
}
