import { Search } from 'lucide-react';
import type * as React from 'react';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type Props = React.ComponentProps<typeof Input> & {
    wrapperClassName?: string;
    iconClassName?: string;
};

function SearchInput({
    className,
    wrapperClassName,
    iconClassName,
    ...props
}: Props) {
    return (
        <div className={cn('relative', wrapperClassName)}>
            <Search
                className={cn(
                    'text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2',
                    iconClassName,
                )}
            />
            <Input className={cn('pl-9', className)} {...props} />
        </div>
    );
}

export { SearchInput };
