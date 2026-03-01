import { Head, Link, useForm } from '@inertiajs/react';
import { useState, type FormEvent } from 'react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
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
    const form = useForm({
        planter_code: '',
        name: '',
        address: '',
        contact_number: '',
        tin_number: '',
        registration_date: new Date().toISOString().split('T')[0], // Default to today's date
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        const res = form.post(store.url(), {
            onSuccess: (page) => {
                setShowModal(true);
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

                <form onSubmit={handleSubmit} className="mx-5 w-full max-w-2xl">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
