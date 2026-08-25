import React from 'react';
import { Link } from '@inertiajs/react';
import { AlertCircle, AlertTriangle, ArrowRight, Info } from 'lucide-react';
import { useCan } from '@/hooks/use-can';
import { cn } from '@/lib/utils';

export interface ActionQueueItem {
    id: string;
    permission: string;
    level: 'critical' | 'warning' | 'info';
    count: number;
    amount?: number | null;
    title: string;
    description: string;
    action_label: string;
    href: string;
}

interface DashboardActionBannerProps {
    items: ActionQueueItem[];
    className?: string;
}

export const DashboardActionBanner: React.FC<DashboardActionBannerProps> = ({
    items = [],
    className,
}) => {
    const { can } = useCan();

    const visibleItems = items.filter((item) => item.count > 0 && can(item.permission));

    if (visibleItems.length === 0) {
        return null;
    }

    return (
        <div
            className={cn(
                'flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200/80 bg-amber-50/60 px-4 py-2.5 text-xs text-amber-900',
                className,
            )}
        >
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="font-bold flex items-center gap-1.5 text-amber-800">
                    <span className="flex size-2 rounded-full bg-amber-500 animate-pulse" />
                    Attention Needed:
                </span>

                {visibleItems.map((item) => (
                    <Link
                        key={item.id}
                        href={item.href}
                        className="inline-flex items-center gap-1 font-medium hover:underline hover:text-amber-950 transition-colors"
                    >
                        <span className="font-bold underline decoration-amber-300 underline-offset-2">
                            {item.title} ({item.count})
                        </span>
                    </Link>
                ))}
            </div>

            <Link
                href={visibleItems[0]?.href || '/Productions'}
                className="inline-flex items-center gap-1 font-bold text-amber-900 hover:text-amber-950 transition-colors shrink-0"
            >
                <span>Review First Item</span>
                <ArrowRight className="size-3" />
            </Link>
        </div>
    );
};
