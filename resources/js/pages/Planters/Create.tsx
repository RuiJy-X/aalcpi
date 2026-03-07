import { Head, Link, useForm } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import Heading from '@/components/heading';
import NewLand from '@/components/planters/ui/new-land';
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
    const [landCount, setlandCount] = useState<number[]>([0]);
    const form = useForm({
        planter_code: '',
        name: '',
        address: '',
        contact_number: '',
        tin_number: '',
        registration_date: new Date().toISOString().split('T')[0], // Default to today's date
        lands: [
            {
                name: '',
                address: '',
                area_hectares: '',
                distance_from_urc: '',
                is_active: true,
            },
        ],
    });

    const addLand = () => {
        form.setData('lands', [
            ...form.data.lands,
            {
                name: '',
                address: '',
                area_hectares: '',
                distance_from_urc: '',
                is_active: true,
            },
        ]);
    };

    const removeLand = (index: number) => {
        const updatedLands = form.data.lands.filter((_, i) => i !== index);
        form.setData('lands', updatedLands);
    };

    const handleOnChangeLand = (
        index: number,
        field: string,
        value: string | boolean,
    ) => {
        const updatedLands = form.data.lands.map((land, i) => {
            if (i === index) {
                return {
                    ...land,
                    [field]: value,
                };
            }
            return land;
        });
        form.setData('lands', updatedLands);
    };

    const handleAddLand = () => {
        const nextId = landCount.length ? Math.max(...landCount) + 1 : 1;
        setlandCount((prev) => [...prev, nextId]);
        addLand();
    };

    const handleRemoveLand = (landId: number) => {
        setlandCount((prev) => prev.filter((id) => id !== landId));
        removeLand(landId);
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        form.post(store.url(), {
            onSuccess: () => {
                setShowModal(true);
                form.reset(); // Reset form data
                setlandCount([0]); // Reset landCount to its initial state
                form.setData('lands', [
                    {
                        name: '',
                        address: '',
                        area_hectares: '',
                        distance_from_urc: '',
                        is_active: true,
                    },
                ]); // Reset lands array explicitly
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
                                value={form.data.planter_code}
                                onChange={(e) =>
                                    form.setData('planter_code', e.target.value)
                                }
                            />
                            {form.errors.planter_code && (
                                <p className="text-sm text-red-500">
                                    {form.errors.planter_code}
                                </p>
                            )}
                        </Field>
                        <Field>
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                name="name"
                                placeholder="Enter planter name"
                                value={form.data.name}
                                onChange={(e) =>
                                    form.setData('name', e.target.value)
                                }
                            />
                            {form.errors.name && (
                                <p className="text-sm text-red-500">
                                    {form.errors.name}
                                </p>
                            )}
                        </Field>
                        <Field className="md:col-span-2">
                            <Label htmlFor="address">Address</Label>
                            <Input
                                id="address"
                                name="address"
                                placeholder="Enter address"
                                value={form.data.address}
                                onChange={(e) =>
                                    form.setData('address', e.target.value)
                                }
                            />
                            {form.errors.address && (
                                <p className="text-sm text-red-500">
                                    {form.errors.address}
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
                                value={form.data.contact_number}
                                onChange={(e) =>
                                    form.setData(
                                        'contact_number',
                                        e.target.value,
                                    )
                                }
                            />
                            {form.errors.contact_number && (
                                <p className="text-sm text-red-500">
                                    {form.errors.contact_number}
                                </p>
                            )}
                        </Field>
                        <Field>
                            <Label htmlFor="tin_number">TIN Number</Label>
                            <Input
                                id="tin_number"
                                name="tin_number"
                                placeholder="Enter TIN number"
                                value={form.data.tin_number}
                                onChange={(e) =>
                                    form.setData('tin_number', e.target.value)
                                }
                            />
                            {form.errors.tin_number && (
                                <p className="text-sm text-red-500">
                                    {form.errors.tin_number}
                                </p>
                            )}
                        </Field>
                    </div>
                    {landCount.map((landId) => (
                        <NewLand
                            key={landId}
                            landId={landId}
                            land={form.data.lands[landId]}
                            onRemove={handleRemoveLand}
                            handleOnChangeLand={handleOnChangeLand}
                        />
                    ))}

                    <Button
                        type="button"
                        variant="outline"
                        className="mt-3"
                        onClick={handleAddLand}
                    >
                        <Plus />
                        Add Lands
                    </Button>

                    <div className="mt-6 flex justify-end gap-2">
                        <Link href={planterIndex.url()}>
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                        </Link>
                        <Button type="submit" disabled={form.processing}>
                            {form.processing ? 'Registering...' : 'Register'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
