import { Trash2 } from 'lucide-react';
import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import type { LandRow } from '../planters-table-types';

interface Props {
    landId: number;
    onRemove: (landId: number) => void;
    land: LandFormData;
    handleOnChangeLand: (
        landId: number,
        field: LandFieldKey,
        value: string | boolean,
    ) => void;
}

type LandFormData = {
    land_code: string;
    name: string;
    address: string;
    area_hectares: string | number;
    distance_from_urc: string | number;
    is_active: boolean;
};

type LandFieldKey = keyof Pick<
    LandRow,
    | 'land_code'
    | 'name'
    | 'address'
    | 'area_hectares'
    | 'distance_from_urc'
    | 'is_active'
>;

const fields: Array<{
    label: string;
    key: LandFieldKey;
    type: 'text' | 'number' | 'checkbox';
}> = [
    { label: 'Land Code', key: 'land_code', type: 'text' },
    { label: 'Land Name', key: 'name', type: 'text' },
    { label: 'Address', key: 'address', type: 'text' },
    { label: 'Area (ha)', key: 'area_hectares', type: 'number' },
    {
        label: 'Distance from URC (km)',
        key: 'distance_from_urc',
        type: 'number',
    },
    { label: 'Active', key: 'is_active', type: 'checkbox' },
];

const NewLand = ({ landId, onRemove, land, handleOnChangeLand }: Props) => {
    return (
        <div className="mt-4 flex flex-col gap-4 border bg-white p-4">
            <div className="flex justify-between">
                <h3 className="text-lg font-semibold">Land #{landId + 1}</h3>
                <i>
                    <Trash2
                        color="red"
                        className="cursor-pointer"
                        onClick={() => onRemove(landId)}
                    />
                </i>
            </div>
            {fields.map((field) => {
                const inputId = `land-${landId}-${field.key}`;
                const inputName = `lands.${landId}.${field.key}`;
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
                                checked={Boolean(land?.is_active)}
                                onCheckedChange={(checked) =>
                                    handleOnChangeLand(
                                        landId,
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
                                    land?.[field.key] === undefined
                                        ? ''
                                        : String(land?.[field.key])
                                }
                                onChange={(e) =>
                                    handleOnChangeLand(
                                        landId,
                                        field.key,
                                        e.target.value,
                                    )
                                }
                            />
                        )}
                    </Field>
                );
            })}
        </div>
    );
};

export default NewLand;
