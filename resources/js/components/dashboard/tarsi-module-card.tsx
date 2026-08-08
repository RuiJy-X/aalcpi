import React from 'react';
import { Link } from '@inertiajs/react';
import { ArrowRight, CheckCircle2, AlertTriangle, Loader2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SegmentedProgressBar, TarsiStatusBadge } from './tarsi-components';

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
    category?: 'operations' | 'finance' | 'hr' | 'system';
    description?: string;
}

interface TarsiModuleCardProps {
    module: ModuleSummaryItem;
    icon: React.ElementType;
}

const categoryBadgeText: Record<string, string> = {
    operations: 'Operations',
    finance: 'Finance',
    hr: 'HR & Admin',
    system: 'System',
};

const moduleDescriptions: Record<string, string> = {
    planters: ' sugarcane planters, codes, contacts, and linked hacienda properties.',
    haciendas: ' sugar plantations, location details, area sizes, and planter assignments.',
    productions: 'Sugarcane delivery tickets, cane weighments, LKG sugar, and molasses yields.',
    weekly: 'Import & review weekly planter PDF summary statements across milling weeks.',
    milling_periods: 'Crop year calendar schedule, sugar factor rates, and molasses pricing.',
    bank_reconciliation: 'Automated check matching, bank statement reconciliation, & error alerts.',
    employees: 'Employee master file, daily rates, wage structures, & position logs.',
    attendance: 'Daily timekeeping logs, overtime hours, and attendance feeds for payroll.',
    payroll: 'Automated gross/net pay calculation, payslip generation, & payment batches.',
    users: 'Manage administrative user accounts, security roles, and permission levels.',
    imports: 'Monitor automated file ingestion status, background jobs, & processing errors.',
};

export const TarsiModuleCard: React.FC<TarsiModuleCardProps> = ({
    module,
    icon: Icon,
}) => {
    const description = moduleDescriptions[module.key] || module.detail;

    // Status map
    const statusTypeMap: Record<
        ModuleSummaryItem['status'],
        'positive' | 'warning' | 'negative' | 'neutral'
    > = {
        healthy: 'positive',
        attention: 'warning',
        busy: 'warning',
        idle: 'neutral',
        empty: 'neutral',
    };

    return (
        <Link
            href={module.href}
            className="group flex flex-col justify-between rounded-[18px] border border-[#E7E6E2] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-200 hover:-translate-y-1 hover:border-[#1F4B32] hover:shadow-md"
        >
            {/* Top Row: Icon Chip + Category Tag + Status Badge */}
            <div>
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                        {/* Soft green icon chip */}
                        <div className="flex size-10 items-center justify-center rounded-[10px] bg-[#E7F0E5] text-[#1F4B32] shadow-xs transition-colors group-hover:bg-[#1F4B32] group-hover:text-white">
                            <Icon className="size-5" />
                        </div>
                        <div>
                            <span className="text-[11px] font-semibold tracking-wider text-[#A5A49E] uppercase">
                                {categoryBadgeText[module.category || 'operations'] || 'Module'}
                            </span>
                            <h4 className="text-[16px] font-bold text-[#1B1B18] leading-tight group-hover:text-[#1F4B32] transition-colors">
                                {module.title}
                            </h4>
                        </div>
                    </div>

                    <TarsiStatusBadge
                        label={module.status_label}
                        type={statusTypeMap[module.status]}
                    />
                </div>

                {/* Module Description */}
                <p className="mt-3 text-xs leading-relaxed text-[#6E6E68] line-clamp-2">
                    {description}
                </p>

                {/* Primary Metric Tile */}
                <div className="mt-4 flex items-baseline justify-between rounded-[12px] bg-[#F2F1EE] px-3.5 py-2.5">
                    <div className="flex flex-col">
                        <span className="text-[11px] font-medium text-[#6E6E68]">
                            {module.metric_label}
                        </span>
                        <span className="text-2xl font-bold tracking-tight text-[#1B1B18]">
                            {new Intl.NumberFormat('en-US').format(module.metric)}
                        </span>
                    </div>
                    <span className="text-[11px] font-medium text-[#6E6E68]">
                        {module.detail}
                    </span>
                </div>

                {/* Progress Bar (if available) */}
                {module.progress !== null && module.progress !== undefined && (
                    <div className="mt-3">
                        <SegmentedProgressBar
                            value={module.progress}
                            segments={16}
                            showPercent={true}
                            barHeight="h-2"
                        />
                    </div>
                )}
            </div>

            {/* Footer Row */}
            <div className="mt-4 flex items-center justify-between border-t border-[#E7E6E2]/60 pt-3 text-xs font-semibold text-[#1F4B32]">
                <span>Open {module.title}</span>
                <span className="flex items-center gap-1 transition-transform duration-200 group-hover:translate-x-1">
                    <ArrowRight className="size-4" />
                </span>
            </div>
        </Link>
    );
};
