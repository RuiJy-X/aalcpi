import { Head, Link, useForm } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import Heading from '@/components/heading';
import type {
    PlanterRow,
    HaciendaRow,
} from '@/components/planters/planters-table-types';
import NewHacienda from '@/components/planters/ui/new-hacienda';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { index as haciendaIndex, create, store } from '@/routes/haciendas';
import { show as planterShow } from '@/routes/planters';
import type { BreadcrumbItem } from '@/types';

export default function Create({
    planter,
    haciendas,
}: {
    planter: PlanterRow;
    haciendas: HaciendaRow[];
}) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Hacienda Management',
            href: haciendaIndex.url(),
        },
        {
            title: 'Register Hacienda',
            href: create.url(planter.id),
        },
    ];
    const [showModal, setShowModal] = useState(false);

    const [haciendaCount, sethaciendaCount] = useState<number[]>([]);

    const { data, setData, post, processing, errors } = useForm({
        haciendas: [] as {
            name: string;
            hacienda_code: string;
            address: string;
            area_hectares: string;
            distance_from_urc: string;
            is_active: boolean;
        }[],
    });

    const addHacienda = () => {
        setData('haciendas', [
            ...data.haciendas,
            {
                name: '',
                hacienda_code: '',
                address: '',
                area_hectares: '',
                distance_from_urc: '',
                is_active: true,
            },
        ]);
    };

    const handleOnChangeHacienda = (
        index: number,
        field: string,
        value: string | boolean,
    ) => {
        const updatedHaciendas = data.haciendas.map((hacienda, i) => {
            if (i === index) {
                return {
                    ...hacienda,
                    [field]: value,
                };
            }
            return hacienda;
        });
        setData('haciendas', updatedHaciendas);
    };

    const handleAddHacienda = () => {
        const nextId = haciendaCount.length
            ? Math.max(...haciendaCount) + 1
            : 0;
        sethaciendaCount((prev) => [...prev, nextId]);
        addHacienda();
    };

    const handleRemoveHacienda = (haciendaId: number) => {
        const idx = haciendaCount.indexOf(haciendaId);
        sethaciendaCount((prev) => prev.filter((id) => id !== haciendaId));
        if (idx !== -1) {
            const updatedHaciendas = data.haciendas.filter((_, i) => i !== idx);
            setData('haciendas', updatedHaciendas);
        }
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        post(store.url(planter.id), {
            onSuccess: () => {
                setShowModal(true);
                sethaciendaCount([]);
                setData('haciendas', []);
            },
            onError: (errors) => {
                console.error('Form submission errors:', errors);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Register Hacienda" />
            <div className="px-4 py-6">
                <Heading
                    className="mb-7 flex w-full flex-col justify-center text-center"
                    title="Register new haciendas"
                    description="Add new haciendas for this planter"
                />
                {showModal && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <h2>Success!</h2>
                            <p>Hacienda has been registered.</p>
                            <button onClick={() => setShowModal(false)}>
                                Close
                            </button>
                        </div>
                    </div>
                )}

                <form
                    onSubmit={handleSubmit}
                    className="m-auto w-full max-w-5xl"
                >
                    <div className="grid grid-cols-1 gap-4 border bg-white p-4 md:grid-cols-2">
                        <h3 className="col-span-2 text-lg font-semibold">
                            Planter Details
                        </h3>
                        <Field>
                            <Label htmlFor="planter_code">Planter Code</Label>
                            <Input
                                id="planter_code"
                                value={planter.planter_code}
                                disabled
                            />
                        </Field>
                        <Field>
                            <Label htmlFor="name">Name</Label>
                            <Input id="name" value={planter.name} disabled />
                        </Field>
                        <Field className="md:col-span-2">
                            <Label htmlFor="address">Address</Label>
                            <Input
                                id="address"
                                value={planter.address}
                                disabled
                            />
                        </Field>
                        <Field>
                            <Label htmlFor="contact_number">
                                Contact Number
                            </Label>
                            <Input
                                id="contact_number"
                                value={planter.contact_number}
                                disabled
                            />
                        </Field>
                        <Field>
                            <Label htmlFor="tin_number">TIN Number</Label>
                            <Input
                                id="tin_number"
                                value={planter.tin_number}
                                disabled
                            />
                        </Field>
                    </div>

                    {haciendas.length > 0 && (
                        <div className="mt-4">
                            <h3 className="text-lg font-semibold">
                                Existing Haciendas
                            </h3>
                            {haciendas.map((hacienda, index) => {
                                return (
                                    <div
                                        key={hacienda.id}
                                        className="mt-2 grid grid-cols-1 gap-4 border bg-gray-50 bg-white p-4 md:grid-cols-2"
                                    >
                                        <h4 className="col-span-2 font-medium">
                                            Hacienda #{index + 1}
                                        </h4>
                                        <Field>
                                            <Label>Hacienda Code</Label>
                                            <Input
                                                value={hacienda.hacienda_code}
                                                disabled
                                            />
                                        </Field>
                                        <Field>
                                            <Label>Hacienda Name</Label>
                                            <Input
                                                value={hacienda.name}
                                                disabled
                                            />
                                        </Field>
                                        <Field>
                                            <Label>Address</Label>
                                            <Input
                                                value={hacienda.address}
                                                disabled
                                            />
                                        </Field>
                                        <Field>
                                            <Label>Area (ha)</Label>
                                            <Input
                                                value={hacienda.area_hectares}
                                                disabled
                                            />
                                        </Field>
                                        <Field>
                                            <Label>
                                                Distance from URC (km)
                                            </Label>
                                            <Input
                                                value={
                                                    hacienda.distance_from_urc
                                                }
                                                disabled
                                            />
                                        </Field>
                                        <Field>
                                            <Label>Status</Label>
                                            <Input
                                                value={
                                                    hacienda.is_active
                                                        ? 'Active'
                                                        : 'Inactive'
                                                }
                                                disabled
                                            />
                                        </Field>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <h3 className="mt-6 text-lg font-semibold">
                        New Haciendas
                    </h3>

                    {haciendaCount.map((haciendaId, idx) => (
                        <NewHacienda
                            key={haciendaId}
                            haciendaId={idx}
                            hacienda={data.haciendas[idx]}
                            errors={errors}
                            onRemove={() => handleRemoveHacienda(haciendaId)}
                            handleOnChangeHacienda={handleOnChangeHacienda}
                        />
                    ))}

                    <Button
                        type="button"
                        variant="outline"
                        className="mt-3"
                        onClick={handleAddHacienda}
                    >
                        <Plus />
                        Add Hacienda
                    </Button>

                    <div className="mt-6 flex justify-end gap-2">
                        <Link href={planterShow(planter.id).url}>
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                        </Link>
                        <Button
                            type="submit"
                            disabled={processing || data.haciendas.length === 0}
                        >
                            {processing ? 'Saving...' : 'Save Haciendas'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
