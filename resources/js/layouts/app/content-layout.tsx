import React from 'react';

const ContentLayout = ({ children }: { children: React.ReactNode }) => {
    return <div className="p-8">{children}</div>;
};

export default ContentLayout;
