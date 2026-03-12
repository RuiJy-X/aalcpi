import { useForm } from '@inertiajs/react';
import { useState } from 'react';

import EditButton from '@/components/edit-button';
import type { LandRow } from '@/components/planters/planters-table-types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { update as landUpdate } from '@/routes/lands';

const LandsInfo = ({ land }: { land: LandRow }) => {
    const [isEditing, setIsEditing] = useState(false);

    const initialData = {
        id: land.id,
        planter_id: land.planter_id,
        name: land.name ?? '',
        address: land.address ?? '',
        area_hectares: land.area_hectares ?? '',
        distance_from_urc: land.distance_from_urc ?? '',
        is_active: land.is_active ?? false,
        created_at: land.created_at ?? '',
        updated_at: land.updated_at ?? '',
    };

    const { data, setData, patch, processing, errors } = useForm(initialData);

    const submit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        patch(landUpdate(land.id).url, {
            onSuccess: () => {
                setData(initialData);
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

    const handleEditingChange = (value: boolean) => {
        setData(initialData);
        setIsEditing(value);
    };

    const details = [
        { label: 'Land ID', key: 'id', value: land.id },
        { label: 'Planter ID', key: 'planter_id', value: land.planter_id },
        { label: 'Name', key: 'name', value: land.name ?? '' },
        { label: 'Address', key: 'address', value: land.address ?? '' },
        {
            label: 'Area (hectares)',
            key: 'area_hectares',
            value: land.area_hectares ?? '',
        },
        {
            label: 'Distance from URC',
            key: 'distance_from_urc',
            value: land.distance_from_urc ?? '',
        },
        { label: 'Active', key: 'is_active', value: land.is_active ?? false },
        {
            label: 'Created At',
            key: 'created_at',
            value: land.created_at ?? '',
        },
        {
            label: 'Updated At',
            key: 'updated_at',
            value: land.updated_at ?? '',
        },
    ] as const;

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Land Details</CardTitle>
                {errors.name && (
                    <p className="text-sm text-red-600">{errors.name}</p>
                )}
                <div className="flex gap-2">
                    {isEditing && (
                        <Button
                            type="submit"
                            form="lands-info-form"
                            variant="blue"
                            disabled={processing}
                        >
                            Save
                        </Button>
                    )}
                    <EditButton
                        isEditing={isEditing}
                        onEditingChange={handleEditingChange}
                        editLabel="Edit Land"
                    />
                </div>
            </CardHeader>
            <CardContent>
                {isEditing ? (
                    <form onSubmit={submit} id="lands-info-form">
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
