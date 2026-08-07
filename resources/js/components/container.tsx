import { cn } from '@/lib/utils';
import React from 'react';

export const ContainerHeader = ({
    children,
    className,
}: {
    children?: React.ReactNode;
    className?: string;
}) => {
    return (
        <div
            className={cn(
                'mb-4 flex flex-wrap items-center justify-between gap-4 text-xl font-bold tracking-tight text-foreground sm:text-2xl',
                className,
            )}
        >
            {children}
        </div>
    );
};

export const ContainerHeaderTitle = ({
    children,
    className,
}: {
    children?: React.ReactNode;
    className?: string;
}) => {
    return (
        <div
            className={cn(
                'flex items-center gap-2 text-lg font-bold tracking-tight text-foreground',
                className,
            )}
        >
            <h1>{children}</h1>
        </div>
    );
};

export const Container = ({
    children,
    className,
}: {
    children?: React.ReactNode;
    className?: string;
}) => {
    return (
        <div
            className={cn(
                'my-4 rounded-xl border border-border bg-card p-5 shadow-sm transition-all duration-200 sm:p-6 md:p-8',
                className,
            )}
        >
            {children}
        </div>
    );
};

export const ContainerHeaderEnd = ({
    children,
    className,
}: {
    children?: React.ReactNode;
    className?: string;
}) => {
    return (
        <div
            className={cn(
                'flex items-center justify-end gap-2 text-sm font-medium',
                className,
            )}
        >
            {children}
        </div>
    );
};
