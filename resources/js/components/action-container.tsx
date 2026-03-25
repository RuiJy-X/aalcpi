import type { HTMLAttributes } from 'react';

const ActionContainer = ({
    children,
    className = '',
    ...props
}: HTMLAttributes<HTMLDivElement>) => {
    return (
        <div
            className={`flex gap-2 rounded-b-md border-b border-gray-200 bg-white px-4 py-2 ${className}`}
            {...props}
        >
            {children}
        </div>
    );
};

export default ActionContainer;
