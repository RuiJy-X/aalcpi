import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import type { AppLayoutProps } from '@/types';
import ContentLayout from './app/content-layout';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export default ({ children, breadcrumbs, ...props }: AppLayoutProps) => (
    <AppLayoutTemplate breadcrumbs={breadcrumbs} {...props}>
        <ContentLayout>
            <div className="flex justify-end">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => window.location.reload()}
                    aria-label="Refresh"
                >
                    <RefreshCw />
                    Refresh
                </Button>
            </div>
            {children}
        </ContentLayout>
    </AppLayoutTemplate>
);
