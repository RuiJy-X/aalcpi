import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import type { FormEvent } from 'react';
import {
    Container,
    ContainerHeader,
    ContainerHeaderEnd,
} from '@/components/container';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import {
    edit as millingPeriodEdit,
    index as millingPeriodIndex,
    show as millingPeriodShow,
    update as millingPeriodUpdate,
} from '@/routes/MillingPeriods';
import type { BreadcrumbItem } from '@/types';
import type { MillingPeriodRow } from '@/components/milling-periods/milling-periods-types';
import type { SharedData } from '@/types';

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

export default function Show({
    milling_period,
    isEditing,
}: {
    milling_period: MillingPeriodRow;
    isEditing: boolean;
}) {
    const page = usePage<SharedData>();
    const successMessage = page.props.flash?.success;

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Milling Periods Management',
            href: millingPeriodIndex().url,
        },
        {
            title: `Milling Period #${milling_period.id}`,
            href: millingPeriodShow(milling_period.id).url,
        },
    ];

    const { data, setData, errors, processing, put } =
        useForm<MillingPeriodFormData>({
            week_no: String(milling_period.week_no ?? ''),
            crop_year: milling_period.crop_year ?? '',
            start_date: milling_period.start_date ?? '',
            end_date: milling_period.end_date ?? '',
            sugar_factor: String(milling_period.sugar_factor ?? ''),
            mol_factor: String(milling_period.mol_factor ?? ''),
            sugar_price: String(milling_period.sugar_price ?? ''),
            mol_price: String(milling_period.mol_price ?? ''),
        });

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        put(millingPeriodUpdate(milling_period.id).url, {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Milling Period Details" />

            {successMessage && (
                <div className="mx-3 mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                    {successMessage}
                </div>
            )}

            <Container>
                <ContainerHeader>
                    Milling Period #{milling_period.id}
                    <ContainerHeaderEnd>
                        {!isEditing && (
                            <Button
                                variant="blue"
                                onClick={() =>
                                    router.get(
                                        millingPeriodEdit(milling_period.id)
                                            .url,
                                    )
                                }
                            >
                                Edit
                            </Button>
                        )}
                    </ContainerHeaderEnd>
                </ContainerHeader>

                <form
                    onSubmit={handleSubmit}
                    className="grid grid-cols-1 gap-4 md:grid-cols-2"
                >
                    <Field>
                        <Label htmlFor="crop_year">Crop Year</Label>
                        <Input
                            id="crop_year"
                            value={data.crop_year}
                            disabled={!isEditing}
                            onChange={(event) =>
                                setData('crop_year', event.target.value)
                            }
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
                            disabled={!isEditing}
                            onChange={(event) =>
                                setData('week_no', event.target.value)
                            }
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
                            disabled={!isEditing}
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
                            disabled={!isEditing}
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
                            value={Number(data.sugar_factor)}
                            disabled={!isEditing}
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
                            value={Number(data.mol_factor)}
                            disabled={!isEditing}
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
                        <Label htmlFor="sugar_price">Sugar Price</Label>
                        <Input
                            id="sugar_price"
                            type="number"
                            step="0.001"
                            min={0}
                            value={Number(data.sugar_price)}
                            disabled={!isEditing}
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
                            step="0.001"
                            min={0}
                            value={Number(data.mol_price)}
                            disabled={!isEditing}
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
                                Back to List
                            </Button>
                        </Link>

                        {isEditing && (
                            <>
                                <Link
                                    href={
                                        millingPeriodShow(milling_period.id).url
                                    }
                                >
                                    <Button type="button" variant="secondary">
                                        Cancel
                                    </Button>
                                </Link>
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </>
                        )}
                    </div>
                </form>
            </Container>
        </AppLayout>
    );
}
