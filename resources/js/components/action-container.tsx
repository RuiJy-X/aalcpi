import { ReactComponent } from 'node_modules/@inertiajs/react/types/types';
import React, { HTMLAttributes } from 'react';

const ActionContainer = ({
    children,
    className = '',
    ...props
}: HTMLAttributes<HTMLDivElement>) => {
    return (
        <div
            className={`flex gap-2 border border-gray-200 px-4 py-2 ${className}`}
            {...props}
        >
            {children}
        </div>
    );
};

export default ActionContainer;
