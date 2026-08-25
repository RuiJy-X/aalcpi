import React, { useState, useMemo } from 'react';
import { Link } from '@inertiajs/react';
import {
    LayoutGrid,
    Search,
    ArrowRight,
    User,
    LandPlot,
    BookOpen,
    CalendarDays,
    ShieldCheck,
    Banknote,
    Briefcase,
    Clipboard,
    DollarSign,
    Users,
    FileSpreadsheet,
} from 'lucide-react';
import { useCan } from '@/hooks/use-can';
import { cn } from '@/lib/utils';

export interface ModuleSummaryItem {
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
}

interface DashboardModuleDirectoryProps {
    modules: ModuleSummaryItem[];
    className?: string;
}

const moduleIcons: Record<string, React.ElementType> = {
    planters: User,
    haciendas: LandPlot,
    productions: BookOpen,
    weekly: CalendarDays,
    milling_periods: ShieldCheck,
    bank_reconciliation: Banknote,
    employees: Briefcase,
    attendance: Clipboard,
    payroll: DollarSign,
    users: Users,
    imports: FileSpreadsheet,
};

export const DashboardModuleDirectory: React.FC<DashboardModuleDirectoryProps> = ({
    modules = [],
    className,
}) => {
    const { can, canAny } = useCan();
    const [search, setSearch] = useState('');

    const visibleModules = useMemo(() => {
        return modules.filter((m) => {
            let allowed = false;
            if (m.key === 'imports') {
                allowed = canAny([
                    'planters.import',
                    'productions.import',
                    'attendance.import',
                    'weekly.create',
                    'bank_reconciliation.create',
                ]);
            } else {
                allowed = can(m.permission);
            }

            if (!allowed) return false;

            if (search.trim()) {
                const q = search.toLowerCase();
                return (
                    m.title.toLowerCase().includes(q) ||
                    m.metric_label.toLowerCase().includes(q) ||
                    m.detail.toLowerCase().includes(q)
                );
            }

            return true;
        });
    }, [modules, can, canAny, search]);

    if (visibleModules.length === 0 && !search) {
        return null;
    }

    return (
        <div
            className={cn(
                'rounded-2xl border border-slate-200 bg-white p-6 shadow-xs',
                className,
            )}
        >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 mb-5">
                <div>
                    <div className="flex items-center gap-2">
                        <LayoutGrid className="size-5 text-slate-900" />
                        <h2 className="text-base font-bold tracking-tight text-slate-900">
                            System Workspaces & Directory
                        </h2>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Direct workspace access and live status indicators across all authorized modules
                    </p>
                </div>

                {/* Search Box */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search workspace..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-48 rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {visibleModules.map((m) => {
                    const Icon = moduleIcons[m.key] || LayoutGrid;

                    return (
                        <Link
                            key={m.key}
                            href={m.href}
                            className="group flex flex-col justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition-all hover:bg-white hover:border-slate-300 hover:shadow-xs"
                        >
                            <div>
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex size-9 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-700 group-hover:bg-slate-900 group-hover:text-white transition-colors shadow-2xs">
                                        <Icon className="size-4" />
                                    </div>
                                    <span
                                        className={cn(
                                            'rounded-full px-2 py-0.5 text-[10px] font-bold',
                                            m.status === 'attention' || m.status === 'busy'
                                                ? 'bg-amber-100 text-amber-800'
                                                : 'bg-emerald-100 text-emerald-800',
                                        )}
                                    >
                                        {m.status_label}
                                    </span>
                                </div>

                                <div className="mt-3">
                                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-slate-950 transition-colors">
                                        {m.title}
                                    </h4>
                                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                                        {m.detail}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
                                <span className="font-extrabold text-slate-900">
                                    {new Intl.NumberFormat('en-US').format(m.metric)}{' '}
                                    <span className="font-normal text-slate-500">{m.metric_label}</span>
                                </span>
                                <span className="flex items-center gap-1 font-semibold text-slate-700 group-hover:translate-x-0.5 transition-transform">
                                    <span>Open</span>
                                    <ArrowRight className="size-3" />
                                </span>
                            </div>
                        </Link>
                    );
                })}

                {visibleModules.length === 0 && (
                    <div className="col-span-full py-8 text-center text-xs text-slate-400">
                        No workspace matches your search or permissions.
                    </div>
                )}
            </div>
        </div>
    );
};
