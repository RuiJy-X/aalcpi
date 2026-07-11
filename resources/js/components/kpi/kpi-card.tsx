import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type KpiCardProps = {
    title: string;
    value: string | number;
    icon?: LucideIcon;
    iconClassName?: string;
    valueClassName?: string;
    className?: string;
};

/**
 * Compact KPI card matching Bank Reconciliation overview style.
 */
export function KpiCard({
    title,
    value,
    icon: Icon,
    iconClassName,
    valueClassName,
    className,
}: KpiCardProps) {
    return (
        <div
            className={cn(
                'rounded-xl border bg-card p-4 shadow-sm',
                className,
            )}
        >
            <div className="flex items-center gap-2">
                {Icon ? (
                    <Icon
                        className={cn(
                            'size-4 text-muted-foreground',
                            iconClassName,
                        )}
                    />
                ) : null}
                <p className="text-sm font-medium text-muted-foreground">
                    {title}
                </p>
            </div>
            <p
                className={cn(
                    'mt-1 truncate text-2xl font-bold',
                    valueClassName,
                )}
                title={String(value)}
            >
                {value}
            </p>
        </div>
    );
}

type KpiOverviewProps = {
    label?: string;
    periodLabel?: string;
    children: ReactNode;
    className?: string;
};

export function KpiOverview({
    label = 'Overview',
    periodLabel,
    children,
    className,
}: KpiOverviewProps) {
    return (
        <div className={cn('mx-2 mb-6', className)}>
            <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">
                    {label}
                    {periodLabel ? ` — ${periodLabel}` : ' — all dates'}
                </p>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {children}
            </div>
        </div>
    );
}
