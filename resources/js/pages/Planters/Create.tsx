import { Head, Link, useForm } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import Heading from '@/components/heading';
import NewHacienda from '@/components/planters/ui/new-hacienda';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { index as planterIndex, create, store } from '@/routes/planters';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Planter Management',
        href: planterIndex.url(),
    },
    {
        title: 'Register Planter',
        href: create.url(),
    },
];

export default function Create() {
    const [showModal, setShowModal] = useState(false);
    const [haciendaCount, sethaciendaCount] = useState<number[]>([0]);
    const { data, setData, errors, processing, post, reset } = useForm({
        planter_code: '',
        name: '',
        address: '',
        contact_number: '',
        tin_number: '',
        registration_date: new Date().toISOString().split('T')[0], // Default to today's date
        haciendas: [
            {
                name: '',
                hacienda_code: '',
                address: '',
                area_hectares: '',
                distance_from_urc: '',
                is_active: true,
            },
        ],
    });

    const addHacienda = () => {
        setData('haciendas', [
            ...data.haciendas,
            {
                name: '',
                address: '',
                hacienda_code: '',
                area_hectares: '',
                distance_from_urc: '',
                is_active: true,
            },
        ]);
    };

    const removeHacienda = (index: number) => {
        const updatedHaciendas = data.haciendas.filter((_, i) => i !== index);
        setData('haciendas', updatedHaciendas);
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
            : 1;
        sethaciendaCount((prev) => [...prev, nextId]);
        addHacienda();
    };

    const handleRemoveHacienda = (haciendaId: number) => {
        sethaciendaCount((prev) => prev.filter((id) => id !== haciendaId));
        removeHacienda(haciendaId);
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        post(store.url(), {
            onSuccess: () => {
                setShowModal(true);
                reset(); // Reset form data
                sethaciendaCount([0]); // Reset haciendaCount to its initial state
                setData('haciendas', [
                    {
                        name: '',
                        hacienda_code: '',
                        address: '',
                        area_hectares: '',
                        distance_from_urc: '',
                        is_active: true,
                    },
                ]); // Reset haciendas array explicitly
            },
            onError: (errors) => {
                console.error('Form submission errors:', errors);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Products">
                <title>Planters</title>
            </Head>
            <div className="px-4 py-6">
                <Heading
                    className="mb-7 flex w-full flex-col justify-center text-center"
                    title="Register a new planter"
                    description="Fill up the planter details"
                />
                {showModal && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <h2>Success!</h2>
                            <p>Planter has been created.</p>
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
                            <Label htmlFor="planter_code">Plater Code</Label>
                            <Input
                                id="planter_code"
                                name="planter_code"
                                placeholder="Enter planter code"
                                value={data.planter_code}
                                onChange={(e) =>
                                    setData('planter_code', e.target.value)
                                }
                            />
                            {errors.planter_code && (
                                <p className="text-sm text-red-500">
                                    {errors.planter_code}
                                </p>
                            )}
                        </Field>
                        <Field>
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                name="name"
                                placeholder="Enter planter name"
                                value={data.name}
                                onChange={(e) =>
                                    setData('name', e.target.value)
                                }
                            />
                            {errors.name && (
                                <p className="text-sm text-red-500">
                                    {errors.name}
                                </p>
                            )}
                        </Field>
                        <Field className="md:col-span-2">
                            <Label htmlFor="address">Address</Label>
                            <Input
                                id="address"
                                name="address"
                                placeholder="Enter address"
                                value={data.address}
                                onChange={(e) =>
                                    setData('address', e.target.value)
                                }
                            />
                            {errors.address && (
                                <p className="text-sm text-red-500">
                                    {errors.address}
                                </p>
                            )}
                        </Field>
                        <Field>
                            <Label htmlFor="contact_number">
                                Contact Number
                            </Label>
                            <Input
                                id="contact_number"
                                name="contact_number"
                                placeholder="Enter contact number"
                                value={data.contact_number}
                                onChange={(e) =>
                                    setData('contact_number', e.target.value)
                                }
                            />
                            {errors.contact_number && (
                                <p className="text-sm text-red-500">
                                    {errors.contact_number}
                                </p>
                            )}
                        </Field>
                        <Field>
                            <Label htmlFor="tin_number">TIN Number</Label>
                            <Input
                                id="tin_number"
                                name="tin_number"
                                placeholder="Enter TIN number"
                                value={data.tin_number}
                                onChange={(e) =>
                                    setData('tin_number', e.target.value)
                                }
                            />
                            {errors.tin_number && (
                                <p className="text-sm text-red-500">
                                    {errors.tin_number}
                                </p>
                            )}
                        </Field>
                    </div>
                    {haciendaCount.map((haciendaId) => (
                        <NewHacienda
                            key={haciendaId}
                            errors={errors}
                            haciendaId={haciendaId}
                            hacienda={data.haciendas[haciendaId]}
                            onRemove={handleRemoveHacienda}
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
                        Add Haciendas
                    </Button>

                    <div className="mt-6 flex justify-end gap-2">
                        <Link href={planterIndex.url()}>
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                        </Link>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Registering...' : 'Register'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
