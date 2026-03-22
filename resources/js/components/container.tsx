import { cn } from '@/lib/utils';
import React from 'react';

const Container = ({
    children,
    className,
}: {
    children?: React.ReactNode;
    className?: string;
}) => {
    return (
        <div
            className={cn(
                'container-full mx-3 my-2 rounded-md border bg-white px-3 py-2',
                className,
            )}
        >
            {children}
        </div>
    );
};

export default Container;
