/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable import/order */
import { Head, Link } from '@inertiajs/react';
import { User, ShieldCheck } from 'lucide-react';
import ActionContainer from '@/components/action-container';

import Heading from '@/components/heading';
import type { PlanterRow } from '@/components/planters/planters-table-types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { TabsTrigger, TabsList, Tabs } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { index as plantersIndex } from '@/routes/planters';
import { create as createPage } from '@/routes/planters';
import type { BreadcrumbItem } from '@/types';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Planter Management',
        href: plantersIndex().url,
    },
    {
        title: 'Planter Details',
        href: '',
    },
];

export default function Index({ planter }: { planter: PlanterRow }) {
    const createdAt = planter.created_at?.split('T')[0] ?? 'N/A';
    const updatedAt = planter.updated_at?.split('T')[0] ?? 'N/A';

    const details = [
        { label: 'Planter Code', value: planter.planter_code },
        { label: 'Name', value: planter.name },
        { label: 'Address', value: planter.address },
        { label: 'TIN Number', value: planter.tin_number },
        { label: 'Contact Number', value: planter.contact_number },
        { label: 'Registration Date', value: planter.registration_date },
        { label: 'Created At', value: createdAt },
        { label: 'Updated At', value: updatedAt },
    ];

    const [activeTab, setActiveTab] = useState('planters');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Products">
                <title>Planters</title>
            </Head>
            <ActionContainer className="">
                <Tabs
                    value={activeTab}
                    defaultValue="planters"
                    className="w-[400px]"
                    onValueChange={setActiveTab}
                >
                    <TabsList className="">
                        <TabsTrigger value="planters">
                            <User />
                            Planter Info
                        </TabsTrigger>
                        <TabsTrigger value="lands">
                            <User />
                            Lands
                        </TabsTrigger>
                        <TabsTrigger value="productions">
                            <User />
                            Productions
                        </TabsTrigger>
                        <TabsTrigger value="certifications">
                            <User />
                            Certifications
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </ActionContainer>
            <div className="mx-5 my-3">
                <Heading
                    title="View Planter Details"
                    description="Viewing planter details of a specific planter"
                />

                <Card>
                    <CardHeader>
                        <CardTitle>Planter Details</CardTitle>
                        <Button className="max-sm-size">Edit Planter</Button>
                    </CardHeader>
                    <CardContent>
                        {details.map((detail) => (
                            <Field className="mt-3">
                                <FieldLabel>{detail.label}</FieldLabel>
                                <Input
                                    placeholder={detail.label}
                                    value={detail.value}
                                    readOnly
                                />
                            </Field>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
