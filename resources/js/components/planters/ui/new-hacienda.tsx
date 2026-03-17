import { Trash2 } from 'lucide-react';
import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import type { HaciendaRow } from '../planters-table-types';

interface Props {
    haciendaId: number;
    errors?: any;
    onRemove: (haciendaId: number) => void;
    hacienda: HaciendaFormData;
    handleOnChangeHacienda: (
        haciendaId: number,
        field: HaciendaFieldKey,
        value: string | boolean,
    ) => void;
}

type HaciendaFormData = {
    hacienda_code: string;
    name: string;
    address: string;
    area_hectares: string | number;
    distance_from_urc: string | number;
    is_active: boolean;
};

type HaciendaFieldKey = keyof Pick<
    HaciendaRow,
    | 'hacienda_code'
    | 'name'
    | 'address'
    | 'area_hectares'
    | 'distance_from_urc'
    | 'is_active'
>;

const fields: Array<{
    label: string;
    key: HaciendaFieldKey;
    type: 'text' | 'number' | 'checkbox';
}> = [
    { label: 'Hacienda Code', key: 'hacienda_code', type: 'text' },
    { label: 'Hacienda Name', key: 'name', type: 'text' },
    { label: 'Address', key: 'address', type: 'text' },
    { label: 'Area (ha)', key: 'area_hectares', type: 'number' },
    {
        label: 'Distance from URC (km)',
        key: 'distance_from_urc',
        type: 'number',
    },
    { label: 'Active', key: 'is_active', type: 'checkbox' },
];

const NewHacienda = ({
    haciendaId,
    onRemove,
    hacienda,
    handleOnChangeHacienda,
    errors,
}: Props) => {
    return (
        <div className="mt-4 flex flex-col gap-4 border bg-white p-4">
            <div className="flex justify-between">
                <h3 className="text-lg font-semibold">
                    Hacienda #{haciendaId + 1}
                </h3>
                <i>
                    <Trash2
                        color="red"
                        className="cursor-pointer"
                        onClick={() => onRemove(haciendaId)}
                    />
                </i>
            </div>
            {fields.map((field) => {
                const inputId = `hacienda-${haciendaId}-${field.key}`;
                const inputName = `haciendas.${haciendaId}.${field.key}`;
                const isCheckbox = field.type === 'checkbox';

                return (
                    <Field
                        key={field.key}
                        orientation={isCheckbox ? 'horizontal' : 'vertical'}
                        className="w-full"
                    >
                        <FieldLabel htmlFor={inputId}>{field.label}</FieldLabel>
                        {isCheckbox ? (
                            <Checkbox
                                id={inputId}
                                name={inputName}
                                checked={Boolean(hacienda?.is_active)}
                                onCheckedChange={(checked) =>
                                    handleOnChangeHacienda(
                                        haciendaId,
                                        field.key,
                                        checked === true,
                                    )
                                }
                            />
                        ) : (
                            <Input
                                id={inputId}
                                name={inputName}
                                type={field.type}
                                placeholder={field.label}
                                value={
                                    hacienda?.[field.key] === undefined
                                        ? ''
                                        : String(hacienda?.[field.key])
                                }
                                onChange={(e) =>
                                    handleOnChangeHacienda(
                                        haciendaId,
                                        field.key,
                                        e.target.value,
                                    )
                                }
                            />
                        )}
                        {errors[`haciendas.${haciendaId}.${field.key}`] && (
                            <p className="mt-1 text-sm text-red-600">
                                Hacienda {haciendaId + 1}'s {field.key} is
                                required.
                            </p>
                        )}
                    </Field>
                );
            })}
        </div>
    );
};
export default NewHacienda;
