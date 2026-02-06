import { ArrowUpDown } from 'lucide-react';
import type {
    SortKey,
    SortState,
} from '@/components/planters/planters-table-types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Props = {
    label: string;
    sortKey: SortKey;
    sort: SortState;
    onSort: (key: SortKey) => void;
    className?: string;
};

export function SortableHeader({
    label,
    sortKey,
    sort,
    onSort,
    className,
}: Props) {
    const isActive = sort.key === sortKey;

    return (
        <Button
            type="button"
            variant="ghost"
            className={cn('h-8 px-2 text-xs font-semibold', className)}
            onClick={() => onSort(sortKey)}
        >
            <span>{label}</span>
            <ArrowUpDown
                className={cn(
                    'ml-1 h-3.5 w-3.5 opacity-40',
                    isActive && 'opacity-90',
                )}
            />
        </Button>
    );
}
