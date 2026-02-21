'use client';

import type { Table } from '@tanstack/react-table';
import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Props<TData> = {
    table: Table<TData>;
    columnId: string;
    label?: string;
    placeholder?: string;
    className?: string;
    inputClassName?: string;
};

export function DataTableColumnFilter<TData>({
    table,
    columnId,
    label,
    placeholder,
    className,
    inputClassName,
}: Props<TData>) {
    const column = table.getColumn(columnId);

    if (!column) return null;

    return (
        <div className={className ?? 'flex flex-col gap-2'}>
            {label ? (
                <Label className="ml-2 text-gray-500">{label}</Label>
            ) : null}
            <Input
                placeholder={placeholder}
                value={(column.getFilterValue() as string) ?? ''}
                onChange={(event) => column.setFilterValue(event.target.value)}
                className={inputClassName ?? 'max-w-sm'}
            />
        </div>
    );
}
