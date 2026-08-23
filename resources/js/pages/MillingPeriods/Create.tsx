import { Head, Link, useForm } from '@inertiajs/react';
import { useState, type FormEvent } from 'react';
import { Container, ContainerHeader } from '@/components/container';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { DatePickerWithRange } from '@/components/date-range';
import type { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import {
    create as millingPeriodCreate,
    index as millingPeriodIndex,
    store as millingPeriodStore,
} from '@/routes/milling-periods';
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
    sugar_price: string;
    mol_price: string;
};

export default function Create() {
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
    const { data, setData, errors, processing, post } =
        useForm<MillingPeriodFormData>({
            week_no: '',
            crop_year: '',
            start_date: '',
            end_date: '',
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

                    <Field className="md:col-span-2">
                        <Label>Period Date Range</Label>
                        <DatePickerWithRange
                            value={dateRange}
                            onChange={(range) => {
                                setDateRange(range);
                                setData((prev) => ({
                                    ...prev,
                                    start_date: range?.from
                                        ? format(range.from, 'yyyy-MM-dd')
                                        : '',
                                    end_date: range?.to
                                        ? format(range.to, 'yyyy-MM-dd')
                                        : range?.from
                                          ? format(range.from, 'yyyy-MM-dd')
                                          : '',
                                }));
                            }}
                            className="w-full"
                        />
                        {(errors.start_date || errors.end_date) && (
                            <p className="text-sm text-red-500">
                                {errors.start_date || errors.end_date}
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
