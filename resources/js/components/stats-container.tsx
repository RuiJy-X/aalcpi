import type { PropsWithChildren } from 'react';

type StatsContainerProps = PropsWithChildren<{
    className?: string;
}>;

const StatsContainer = ({ children, className }: StatsContainerProps) => {
    return (
        <div
            className={`flex-cols m-3 flex gap-2 rounded-md border border-[color:var(--border)] bg-[color:var(--background)] p-4 shadow ${className}`}
        >
            {children}
        </div>
    );
};

export default StatsContainer;
