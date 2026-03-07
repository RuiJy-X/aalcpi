import React, { HTMLAttributes } from 'react';

const ViewLayout = ({
    children,
    className = '',
    ...props
}: HTMLAttributes<HTMLDivElement>) => {
    return (
        <div className={`mx-5 my-5 ${className}`} {...props}>
            {children}
        </div>
    );
};

export default ViewLayout;
