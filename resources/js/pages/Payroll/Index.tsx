import AppLayout from '@/layouts/app-layout';
import React from 'react';
import type { BreadcrumbItem } from '@/types';
import {
    Container,
    ContainerHeader,
    ContainerHeaderEnd,
} from '@/components/container';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Payroll Management',
        href: '#',
    },
];

const Index = () => {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Payroll"></Head>

            <Container>
                <ContainerHeader>
                    Payroll Table
                    <ContainerHeaderEnd />
                </ContainerHeader>
            </Container>
        </AppLayout>
    );
};

export default Index;
