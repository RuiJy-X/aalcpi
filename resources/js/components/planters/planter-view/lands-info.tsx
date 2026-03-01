import { DataTable } from '@/components/data-table/data-table';
import { landColumns } from '@/components/data-table/land-columns';
import EditButton from '@/components/edit-button';
import type { LandRow } from '@/components/planters/planters-table-types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

const LandsInfo = ({ land }: { land: LandRow }) => {
    const [isEditing, setIsEditing] = useState(false);

    const details = [
        { label: 'Land ID', value: land.id },
        { label: 'Planter ID', value: land.planter_id },
        { label: 'Name', value: land.name },
        { label: 'Address', value: land.address },
        { label: 'Area (hectares)', value: land.area_hectares },
        { label: 'Distance from URC', value: land.distance_from_urc },
        { label: 'Active', value: land.is_active ? 'Yes' : 'No' },
        { label: 'Created At', value: land.created_at },
        { label: 'Updated At', value: land.updated_at },
    ];
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Land Details</CardTitle>
                <EditButton
                    isEditing={isEditing}
                    onEditingChange={setIsEditing}
                    editLabel="Edit Production"
                />
            </CardHeader>
            <CardContent>
                {isEditing ? (
                    <div className="grid grid-cols-2 gap-4">
                        {details.map((detail, index) => (
                            <Field
                                key={detail.label}
                                className="w-full md:w-[calc(50%-0.5rem)]"
                            >
                                <FieldLabel>{detail.label}</FieldLabel>
                                <Input placeholder={String(detail.value)} />
                            </Field>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                        {details.map((detail, index) => (
                            <div key={index} className="flex flex-col">
                                <span className="text-sm font-medium text-gray-500">
                                    {detail.label}
                                </span>
                                <span className="text-sm">{detail.value}</span>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default LandsInfo;
