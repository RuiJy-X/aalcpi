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
                'my-2 flex items-center justify-between gap-3 pb-2 text-lg font-semibold tracking-tight',
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
                'container-full relative mx-3 my-3 overflow-hidden rounded-xl border border-border/80 bg-card px-4 py-3 shadow-sm ring-1 ring-black/5 transition-shadow duration-200 hover:shadow-md sm:px-5 sm:py-4',
                className,
            )}
        >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-16 from-primary/10 via-primary/5 to-transparent dark:from-primary/20 dark:via-primary/10" />
            <div className="relative z-10">{children}</div>
        </div>
    );
};
