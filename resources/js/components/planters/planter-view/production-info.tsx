import { useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import EditButton from '@/components/edit-button';
import type { ProductionRow } from '@/components/planters/planters-table-types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { update as productionUpdate } from '@/routes/productions';
import { Printer } from 'lucide-react';
import { final_data as finalData } from '@/routes/productions';

const ProductionInfo = ({ production }: { production: ProductionRow }) => {
    const initialData = {
        planter_id: production.planter_id,
        planter_code: production.planter_code,
        land_code: production.land_code,
        land_id: production.land_id,
        production_year: production.production_year,
        production_month: production.production_month,
        gross_cw: production.gross_cw,
        net_cw: production.net_cw,
        trucks: production.trucks,
        theoretical_lkg: production.theoretical_lkg,
        actual_lkg: production.actual_lkg,
        pshr_net_lkg: production.pshr_net_lkg,
        pdpa_lkg: production.pdpa_lkg,
        association_dues_lkg: production.association_dues_lkg,
        actual_mol: production.actual_mol,
        pshr_net_mol: production.pshr_net_mol,
        pdpa_mol: production.pdpa_mol,
        association_dues_mol: production.association_dues_mol,
        trans_code: production.trans_code,
        transloading: production.transloading,
    };

    const [isEditing, setIsEditing] = useState(false);

    const submit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        patch(productionUpdate(production.id).url, {
            onSuccess: () => {
                setData(initialData);
                setIsEditing(false);
            },
            onError: (errors) => {
                console.error('Form submission errors:', errors);
            },
        });
        console.log(errors);
    };

    const handleChange = (
        key: (typeof details)[number]['key'],
        value: string | boolean | number,
    ) => {
        setData(key, value);
    };
    const handleEditingChange = (value: boolean) => {
        setData(initialData);
        setIsEditing(value);
    };

    const { data, setData, patch, processing, errors } = useForm(initialData);

    const details = [
        {
            label: 'Planter Code',
            key: 'planter_code',
            value: production.planter_code,
        },
        { label: 'Land Code', key: 'land_code', value: production.land_code },
        {
            label: 'Year',
            key: 'production_year',
            value: production.production_year,
        },
        {
            label: 'Month',
            key: 'production_month',
            value: production.production_month,
        },
        { label: 'Gross CW', key: 'gross_cw', value: production.gross_cw },
        { label: 'Net CW', key: 'net_cw', value: production.net_cw },
        { label: 'Trucks', key: 'trucks', value: production.trucks },
        {
            label: 'Theoretical LKG',
            key: 'theoretical_lkg',
            value: production.theoretical_lkg,
        },
        {
            label: 'Actual LKG',
            key: 'actual_lkg',
            value: production.actual_lkg,
        },
        {
            label: 'PSHR Net LKG',
            key: 'pshr_net_lkg',
            value: production.pshr_net_lkg,
        },
        { label: 'PDPA LKG', key: 'pdpa_lkg', value: production.pdpa_lkg },
        {
            label: 'Association Dues LKG',
            key: 'association_dues_lkg',
            value: production.association_dues_lkg,
        },
        {
            label: 'Actual MOL',
            key: 'actual_mol',
            value: production.actual_mol,
        },
        {
            label: 'PSHR Net MOL',
            key: 'pshr_net_mol',
            value: production.pshr_net_mol,
        },
        { label: 'PDPA MOL', key: 'pdpa_mol', value: production.pdpa_mol },
        {
            label: 'Association Dues MOL',
            key: 'association_dues_mol',
            value: production.association_dues_mol,
        },
        {
            label: 'Trans Code',
            key: 'trans_code',
            value: production.trans_code,
        },
        {
            label: 'Transloading',
            key: 'transloading',
            value: production.transloading,
        },
    ] as const;
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Production Details</CardTitle>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() =>
                            window.open(finalData(production.id).url, '_blank')
                        }
                    >
                        <Printer />
                        Print
                    </Button>
                    {isEditing && (
                        <Button
                            type="submit"
                            form="production-info-form"
                            variant="blue"
                            disabled={processing}
                        >
                            Save
                        </Button>
                    )}
                    <EditButton
                        isEditing={isEditing}
                        onEditingChange={handleEditingChange}
                        editLabel="Edit Production"
                    />
                </div>
            </CardHeader>
            <CardContent>
                {isEditing ? (
                    <form onSubmit={submit} id="production-info-form">
                        <div className="flex flex-col gap-6">
                            <div className="flex flex-row flex-wrap gap-4">
                                {details.slice(0, 4).map((detail) => (
                                    <Field
                                        key={detail.key}
                                        className="w-full md:w-[calc(50%-0.5rem)]"
                                    >
                                        <FieldLabel>{detail.label}</FieldLabel>
                                        <Input
                                            placeholder={detail.label}
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
                            <div className="flex flex-row flex-wrap gap-4">
                                {details.slice(4, 10).map((detail) => (
                                    <Field
                                        key={detail.key}
                                        className="w-full md:w-[calc(33.333%-0.5rem)]"
                                    >
                                        <FieldLabel>{detail.label}</FieldLabel>
                                        <Input
                                            placeholder={detail.label}
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
                            <div className="flex flex-row flex-wrap gap-4">
                                {details.slice(10, 16).map((detail) => (
                                    <Field
                                        key={detail.label}
                                        className="w-full md:w-[calc(33.333%-0.5rem)]"
                                    >
                                        <FieldLabel>{detail.label}</FieldLabel>
                                        <Input
                                            placeholder={detail.label}
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
                            <div className="flex flex-row flex-wrap gap-4">
                                {details.slice(16).map((detail) => (
                                    <Field
                                        key={detail.label}
                                        className="w-full md:w-[calc(50%-0.5rem)]"
                                    >
                                        <FieldLabel>{detail.label}</FieldLabel>
                                        <Input
                                            placeholder={detail.label}
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
                        </div>
                    </form>
                ) : (
                    <div className="flex flex-col gap-6">
                        <div className="flex flex-row flex-wrap gap-4">
                            {details.slice(0, 4).map((detail, index) => (
                                <div
                                    key={index}
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
                            {details.slice(4, 10).map((detail, index) => (
                                <div
                                    key={index}
                                    className="flex w-full flex-col md:w-[calc(33.33%-0.5rem)]"
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
                            {details.slice(10, 16).map((detail, index) => (
                                <div
                                    key={index}
                                    className="flex w-full flex-col md:w-[calc(33.33%-0.5rem)]"
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
                            {details.slice(16).map((detail, index) => (
                                <div
                                    key={index}
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

export default ProductionInfo;
