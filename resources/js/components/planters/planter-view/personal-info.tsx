import { useForm } from '@inertiajs/react';
import { useState } from 'react';
import EditButton from '@/components/edit-button';
import type { PlanterRow } from '@/components/planters/planters-table-types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { update as plantersViewUpdate } from '@/routes/planters';
import PlanterCard from './planter-card';

const PersonalInfo = ({ planter }: { planter: PlanterRow }) => {
    const [isEditing, setIsEditing] = useState(false);
    // const createdAt = planter.created_at?.split('T')[0] ?? 'N/A';
    // const updatedAt = planter.updated_at?.split('T')[0] ?? 'N/A';

    const initialData = {
        id: planter.id,
        planter_code: planter.planter_code ?? '',
        name: planter.name ?? '',
        address: planter.address ?? '',
        tin_number: planter.tin_number ?? '',
        contact_number: planter.contact_number ?? '',
        registration_date: planter.registration_date ?? '',
        createdAt: planter.created_at ?? '',
        updatedAt: planter.updated_at ?? '',
    };

    const { data, setData, patch, processing, errors } = useForm(initialData);

    const submit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        patch(plantersViewUpdate(planter.id).url, {
            onSuccess: () => {
                setData(initialData);
                setIsEditing(false);
            },
            onError: (errors) => {
                console.error('Form submission errors:', errors);
            },
        });
    };

    const fields = [
        {
            label: 'Planter Code',
            key: 'planter_code',
            value: planter.planter_code,
        },
        { label: 'Name', key: 'name', value: planter.name },
        { label: 'Address', key: 'address', value: planter.address },
        { label: 'TIN Number', key: 'tin_number', value: planter.tin_number },
        {
            label: 'Contact Number',
            key: 'contact_number',
            value: planter.contact_number,
        },
        {
            label: 'Registration Date',
            key: 'registration_date',
            value: planter.registration_date,
        },
    ] as const;

    const handleChange = (
        key: (typeof fields)[number]['key'],
        value: string,
    ) => {
        setData(key, value);
    };

    const handleEditingChange = (value: boolean) => {
        setData(initialData);
        setIsEditing(value);
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Planter Details</CardTitle>
                {errors.name && (
                    <p className="text-sm text-red-600">{errors.name}</p>
                )}
                <div className="flex gap-2">
                    {isEditing && (
                        <Button
                            type="submit"
                            form="planter-info-form"
                            variant="blue"
                            disabled={processing}
                        >
                            Save
                        </Button>
                    )}
                    <EditButton
                        isEditing={isEditing}
                        onEditingChange={handleEditingChange}
                        editLabel="Edit Planter"
                    />
                </div>
            </CardHeader>
            <CardContent>
                {isEditing ? (
                    <form onSubmit={submit} id="planter-info-form">
                        <div className="flex flex-col gap-6">
                            <div className="flex flex-row flex-wrap gap-4">
                                {fields.slice(0, 4).map((field) => (
                                    <Field
                                        key={field.key}
                                        className="w-full md:w-[calc(50%-0.5rem)]"
                                    >
                                        <FieldLabel>{field.label}</FieldLabel>

                                        <Input
                                            placeholder={field.label}
                                            value={String(data[field.key])}
                                            onChange={(e) =>
                                                handleChange(
                                                    field.key,
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </Field>
                                ))}
                            </div>
                            <div className="flex flex-row flex-wrap gap-4">
                                {fields.slice(4).map((field) => (
                                    <Field
                                        key={field.key}
                                        className="w-full md:w-[calc(50%-0.5rem)]"
                                    >
                                        <FieldLabel>{field.label}</FieldLabel>
                                        <Input
                                            placeholder={field.label}
                                            value={String(data[field.key])}
                                            onChange={(e) =>
                                                handleChange(
                                                    field.key,
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </Field>
                                ))}
                            </div>
                        </div>
                    </form>
                ) : (
                    <div className="flex flex-col gap-6">
                        <PlanterCard planter={planter} />
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default PersonalInfo;
