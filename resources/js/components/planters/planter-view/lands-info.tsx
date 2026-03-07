import { useForm } from '@inertiajs/react';
import { useState } from 'react';
import { DataTable } from '@/components/data-table/data-table';
import { landColumns } from '@/components/data-table/land-columns';
import EditButton from '@/components/edit-button';
import type { LandRow } from '@/components/planters/planters-table-types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { update as landViewUpdate } from '@/routes/planters/view/land';

const LandsInfo = ({ land }: { land: LandRow }) => {
    const [isEditing, setIsEditing] = useState(false);

    const { data, setData, patch, processing, errors } = useForm({
        id: land.id,
        planter_id: land.planter_id,
        name: land.name ?? '',
        address: land.address ?? '',
        area_hectares: land.area_hectares ?? '',
        distance_from_urc: land.distance_from_urc ?? '',
        is_active: land.is_active ?? false,
        created_at: land.created_at ?? '',
        updated_at: land.updated_at ?? '',
    });

    const submit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        patch(landViewUpdate([land.planter_id, land.id]).url, {
            onSuccess: () => {
                setIsEditing(false);
            },
            onError: (errors) => {
                console.error('Form submission errors:', errors);
            },
        });
    };

    const handleChange = (
        key: (typeof details)[number]['key'],
        value: string | boolean,
    ) => {
        setData(key, value);
    };

    const details = [
        { label: 'Land ID', key: 'id' },
        { label: 'Planter ID', key: 'planter_id' },
        { label: 'Name', key: 'name' },
        { label: 'Address', key: 'address' },
        { label: 'Area (hectares)', key: 'area_hectares' },
        { label: 'Distance from URC', key: 'distance_from_urc' },
        { label: 'Active', key: 'is_active' },
        { label: 'Created At', key: 'created_at' },
        { label: 'Updated At', key: 'updated_at' },
    ] as const;

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
                    <form onSubmit={submit}>
                        <div className="grid grid-cols-2 gap-4">
                            {details.map((detail) => (
                                <Field
                                    key={detail.key}
                                    className="w-full md:w-[calc(50%-0.5rem)]"
                                >
                                    <FieldLabel>{detail.label}</FieldLabel>
                                    <Input
                                        placeholder={String(detail.key)}
                                        value={String(data[detail.key])}
                                        onChange={(e) =>
                                            handleChange(
                                                detail.key,
                                                e.target.value,
                                            )
                                        }
                                    />
                                </Field>
                            ))}
                        </div>
                    </form>
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                        {details.map((detail) => (
                            <div key={detail.key} className="flex flex-col">
                                <span className="text-sm font-medium text-gray-500">
                                    {detail.label}
                                </span>
                                <span className="text-sm">
                                    {data[detail.key]}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default LandsInfo;
