import { FieldGroup, FieldLabel } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { useForm } from '@inertiajs/react';
import {
    DialogTrigger,
    DialogContent,
    DialogTitle,
    DialogDescription,
    DialogClose,
    DialogHeader,
    DialogFooter,
    Dialog,
} from '@/components/ui/dialog';
import { Plus, Pencil } from 'lucide-react';
import React, { useEffect } from 'react';
import { PlanterWithRelations } from '../planters-table-types';
import { Input } from '@/components/ui/input';
import { update as plantersViewUpdate } from '@/routes/planters';
import { DateInput } from '@/components/date-input';

const UpdatePlanterDialog = ({
    planter,
    setIsEditing,
}: {
    planter: PlanterWithRelations;

    setIsEditing: (value: boolean) => void;
}) => {
    const getInitialData = () => ({
        id: planter.id,
        planter_code: planter.planter_code ?? '',
        name: planter.name ?? '',
        address: planter.address ?? '',
        tin_number: planter.tin_number ?? '',
        contact_number: planter.contact_number ?? '',
        registration_date: planter.registration_date ?? '',
        createdAt: planter.created_at ?? '',
        updatedAt: planter.updated_at ?? '',
    });

    const { data, setData, patch } = useForm(getInitialData());

    useEffect(() => {
        setData(getInitialData());
    }, [planter]);

    const submit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        patch(plantersViewUpdate(planter.id).url, {
            onSuccess: () => {
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
        setData(getInitialData());
        setIsEditing(value);
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="default">
                    <i>
                        <Pencil />
                    </i>
                    Edit
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-card sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>Edit Planter Details</DialogTitle>
                    <DialogDescription>
                        Update the details of the planter.
                    </DialogDescription>
                </DialogHeader>
                <FieldGroup>
                    <div>
                        <form onSubmit={submit} id="planter-info-form">
                            <div className="flex flex-col gap-6">
                                {fields.map((field) => {
                                    if (field.key === 'registration_date') {
                                        return (
                                            <DateInput
                                                key={field.key}
                                                id="registration_date"
                                                label={field.label}
                                                value={String(
                                                    data.registration_date,
                                                )}
                                                onChange={(value) =>
                                                    handleChange(
                                                        field.key,
                                                        value,
                                                    )
                                                }
                                                className="w-full"
                                            />
                                        );
                                    }

                                    return (
                                        <Field
                                            key={field.key}
                                            className="w-full"
                                        >
                                            <FieldLabel>
                                                {field.label}
                                            </FieldLabel>

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
                                    );
                                })}
                            </div>
                        </form>
                    </div>
                </FieldGroup>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <DialogClose asChild>
                        <Button type="submit" form="planter-info-form">
                            Save
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default UpdatePlanterDialog;
