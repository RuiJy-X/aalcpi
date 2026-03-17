import { useForm } from '@inertiajs/react';
import { useState } from 'react';

import EditButton from '@/components/edit-button';
import type { HaciendaRow } from '@/components/planters/planters-table-types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { update as haciendaUpdate } from '@/routes/haciendas';

const HaciendasInfo = ({ hacienda }: { hacienda: HaciendaRow }) => {
    const [isEditing, setIsEditing] = useState(false);

    const initialData = {
        id: hacienda.id,
        planter_id: hacienda.planter_id,
        hacienda_code: hacienda.hacienda_code,
        name: hacienda.name ?? '',
        address: hacienda.address ?? '',
        area_hectares: hacienda.area_hectares ?? '',
        distance_from_urc: hacienda.distance_from_urc ?? '',
        is_active: hacienda.is_active ?? false,
        created_at: hacienda.created_at ?? '',
        updated_at: hacienda.updated_at ?? '',
    };

    const { data, setData, patch, processing, errors } = useForm(initialData);

    const submit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        patch(haciendaUpdate(hacienda.id).url, {
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
        {
            label: 'Hacienda Code',
            key: 'hacienda_code',
            value: hacienda.hacienda_code ?? '',
        },
        { label: 'Name', key: 'name', value: hacienda.name ?? '' },
        { label: 'Address', key: 'address', value: hacienda.address ?? '' },
        {
            label: 'Area (hectares)',
            key: 'area_hectares',
            value: hacienda.area_hectares ?? '',
        },
        {
            label: 'Distance from URC',
            key: 'distance_from_urc',
            value: hacienda.distance_from_urc ?? '',
        },
        {
            label: 'Active',
            key: 'is_active',
            value: hacienda.is_active ?? false,
        },
        {
            label: 'Created At',
            key: 'created_at',
            value: hacienda.created_at ?? '',
        },
        {
            label: 'Updated At',
            key: 'updated_at',
            value: hacienda.updated_at ?? '',
        },
    ] as const;

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Hacienda Details</CardTitle>
                <div className="flex gap-2">
                    {isEditing && (
                        <Button
                            type="submit"
                            form="haciendas-info-form"
                            variant="blue"
                            disabled={processing}
                        >
                            Save
                        </Button>
                    )}
                    <EditButton
                        isEditing={isEditing}
                        onEditingChange={handleEditingChange}
                        editLabel="Edit Hacienda"
                    />
                </div>
            </CardHeader>
            <CardContent>
                {isEditing ? (
                    <form onSubmit={submit} id="haciendas-info-form">
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
                                    {errors[detail.key] && (
                                        <p className="text-sm text-red-600">
                                            {errors[detail.key]}
                                        </p>
                                    )}
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

export default HaciendasInfo;
