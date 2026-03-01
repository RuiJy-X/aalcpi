import type { PlanterRow } from '@/components/planters/planters-table-types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import EditButton from '@/components/edit-button';
import { useState } from 'react';

const PersonalInfo = ({ planter }: { planter: PlanterRow }) => {
    const [isEditing, setIsEditing] = useState(false);
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
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Planter Details</CardTitle>
                <EditButton
                    isEditing={isEditing}
                    onEditingChange={setIsEditing}
                    editLabel="Edit Planter"
                />
            </CardHeader>
            <CardContent>
                {isEditing ? (
                    <div className="flex flex-col gap-6">
                        <div className="flex flex-row flex-wrap gap-4">
                            {details.slice(0, 4).map((detail) => (
                                <Field
                                    key={detail.label}
                                    className="w-full md:w-[calc(50%-0.5rem)]"
                                >
                                    <FieldLabel>{detail.label}</FieldLabel>
                                    <Input
                                        placeholder={detail.label}
                                        value={String(detail.value)}
                                    />
                                </Field>
                            ))}
                        </div>
                        <div className="flex flex-row flex-wrap gap-4">
                            {details.slice(4).map((detail) => (
                                <Field
                                    key={detail.label}
                                    className="w-full md:w-[calc(50%-0.5rem)]"
                                >
                                    <FieldLabel>{detail.label}</FieldLabel>
                                    <Input
                                        placeholder={detail.label}
                                        value={String(detail.value)}
                                    />
                                </Field>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-6">
                        <div className="flex flex-row flex-wrap gap-4">
                            {details.slice(0, 4).map((detail) => (
                                <div
                                    key={detail.label}
                                    className="flex w-full flex-col md:w-[calc(50%-0.5rem)]"
                                >
                                    <span className="text-sm font-medium text-gray-500">
                                        {detail.label}
                                    </span>
                                    <span className="text-sm">
                                        {detail.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <hr />
                        <div className="flex flex-row flex-wrap gap-4">
                            {details.slice(4).map((detail) => (
                                <div
                                    key={detail.label}
                                    className="flex w-full flex-col md:w-[calc(50%-0.5rem)]"
                                >
                                    <span className="text-sm font-medium text-gray-500">
                                        {detail.label}
                                    </span>
                                    <span className="text-sm">
                                        {detail.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default PersonalInfo;
