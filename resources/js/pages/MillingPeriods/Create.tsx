import { Head, Link, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { Container, ContainerHeader } from '@/components/container';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import {
    create as millingPeriodCreate,
    index as millingPeriodIndex,
    store as millingPeriodStore,
} from '@/routes/MillingPeriods';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Milling Periods Management',
        href: millingPeriodIndex().url,
    },
    {
        title: 'Create Milling Period',
        href: millingPeriodCreate().url,
    },
];

type MillingPeriodFormData = {
    week_no: string;
    crop_year: string;
    start_date: string;
    end_date: string;
    sugar_factor: string;
    mol_factor: string;
    sugar_price: string;
    mol_price: string;
};

export default function Create() {
    const { data, setData, errors, processing, post } =
        useForm<MillingPeriodFormData>({
            week_no: '',
            crop_year: '',
            start_date: '',
            end_date: '',
            sugar_factor: '',
            mol_factor: '',
            sugar_price: '',
            mol_price: '',
        });

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        post(millingPeriodStore().url);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Milling Period" />

            <Container>
                <ContainerHeader>Create Milling Period</ContainerHeader>

                <form
                    onSubmit={handleSubmit}
                    className="grid grid-cols-1 gap-4 md:grid-cols-2"
                >
                    <Field>
                        <Label htmlFor="crop_year">Crop Year</Label>
                        <Input
                            id="crop_year"
                            value={data.crop_year}
                            onChange={(event) =>
                                setData('crop_year', event.target.value)
                            }
                            placeholder="e.g. 2025-2026"
                        />
                        {errors.crop_year && (
                            <p className="text-sm text-red-500">
                                {errors.crop_year}
                            </p>
                        )}
                    </Field>

                    <Field>
                        <Label htmlFor="week_no">Week No.</Label>
                        <Input
                            id="week_no"
                            type="number"
                            min={1}
                            max={53}
                            value={data.week_no}
                            onChange={(event) =>
                                setData('week_no', event.target.value)
                            }
                            placeholder="e.g. 14"
                        />
                        {errors.week_no && (
                            <p className="text-sm text-red-500">
                                {errors.week_no}
                            </p>
                        )}
                    </Field>

                    <Field>
                        <Label htmlFor="start_date">Start Date</Label>
                        <Input
                            id="start_date"
                            type="date"
                            value={data.start_date}
                            onChange={(event) =>
                                setData('start_date', event.target.value)
                            }
                        />
                        {errors.start_date && (
                            <p className="text-sm text-red-500">
                                {errors.start_date}
                            </p>
                        )}
                    </Field>

                    <Field>
                        <Label htmlFor="end_date">End Date</Label>
                        <Input
                            id="end_date"
                            type="date"
                            value={data.end_date}
                            onChange={(event) =>
                                setData('end_date', event.target.value)
                            }
                        />
                        {errors.end_date && (
                            <p className="text-sm text-red-500">
                                {errors.end_date}
                            </p>
                        )}
                    </Field>

                    <Field>
                        <Label htmlFor="sugar_factor">Sugar Factor</Label>
                        <Input
                            id="sugar_factor"
                            type="number"
                            step="any"
                            min={0}
                            value={data.sugar_factor}
                            onChange={(event) =>
                                setData('sugar_factor', event.target.value)
                            }
                        />
                        {errors.sugar_factor && (
                            <p className="text-sm text-red-500">
                                {errors.sugar_factor}
                            </p>
                        )}
                    </Field>

                    <Field>
                        <Label htmlFor="mol_factor">Molasses Factor</Label>
                        <Input
                            id="mol_factor"
                            type="number"
                            step="any"
                            min={0}
                            value={data.mol_factor}
                            onChange={(event) =>
                                setData('mol_factor', event.target.value)
                            }
                        />
                        {errors.mol_factor && (
                            <p className="text-sm text-red-500">
                                {errors.mol_factor}
                            </p>
                        )}
                    </Field>

                    <Field>
                        <Label htmlFor="sugar_price">Sugar Price / LKG</Label>
                        <Input
                            id="sugar_price"
                            type="number"
                            step="0.0001"
                            min={0}
                            value={data.sugar_price}
                            onChange={(event) =>
                                setData('sugar_price', event.target.value)
                            }
                        />
                        {errors.sugar_price && (
                            <p className="text-sm text-red-500">
                                {errors.sugar_price}
                            </p>
                        )}
                    </Field>

                    <Field>
                        <Label htmlFor="mol_price">Molasses Price</Label>
                        <Input
                            id="mol_price"
                            type="number"
                            step="0.0001"
                            min={0}
                            value={data.mol_price}
                            onChange={(event) =>
                                setData('mol_price', event.target.value)
                            }
                        />
                        {errors.mol_price && (
                            <p className="text-sm text-red-500">
                                {errors.mol_price}
                            </p>
                        )}
                    </Field>

                    <div className="col-span-1 mt-2 flex justify-end gap-2 md:col-span-2">
                        <Link href={millingPeriodIndex().url}>
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                        </Link>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Saving...' : 'Save Milling Period'}
                        </Button>
                    </div>
                </form>
            </Container>
        </AppLayout>
    );
}
