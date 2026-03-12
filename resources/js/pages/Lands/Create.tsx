import { Head, Link, useForm } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import Heading from '@/components/heading';
import type {
    PlanterRow,
    LandRow,
} from '@/components/planters/planters-table-types';
import NewLand from '@/components/planters/ui/new-land';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { index as landIndex, create, store } from '@/routes/lands';
import { show as planterShow } from '@/routes/planters';
import type { BreadcrumbItem } from '@/types';

export default function Create({
    planter,
    lands,
}: {
    planter: PlanterRow;
    lands: LandRow[];
}) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Land Management',
            href: landIndex.url(),
        },
        {
            title: 'Register Land',
            href: create.url(planter.id),
        },
    ];
    const [showModal, setShowModal] = useState(false);

    const [landCount, setlandCount] = useState<number[]>([]);

    const { data, setData, post, processing } = useForm({
        lands: [] as {
            name: string;
            address: string;
            area_hectares: string;
            distance_from_urc: string;
            is_active: boolean;
        }[],
    });

    const addLand = () => {
        setData('lands', [
            ...data.lands,
            {
                name: '',
                address: '',
                area_hectares: '',
                distance_from_urc: '',
                is_active: true,
            },
        ]);
    };

    const handleOnChangeLand = (
        index: number,
        field: string,
        value: string | boolean,
    ) => {
        const updatedLands = data.lands.map((land, i) => {
            if (i === index) {
                return {
                    ...land,
                    [field]: value,
                };
            }
            return land;
        });
        setData('lands', updatedLands);
    };

    const handleAddLand = () => {
        const nextId = landCount.length ? Math.max(...landCount) + 1 : 0;
        setlandCount((prev) => [...prev, nextId]);
        addLand();
    };

    const handleRemoveLand = (landId: number) => {
        const idx = landCount.indexOf(landId);
        setlandCount((prev) => prev.filter((id) => id !== landId));
        if (idx !== -1) {
            const updatedLands = data.lands.filter((_, i) => i !== idx);
            setData('lands', updatedLands);
        }
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        post(store.url(planter.id), {
            onSuccess: () => {
                setShowModal(true);
                setlandCount([]);
                setData('lands', []);
            },
            onError: (errors) => {
                console.error('Form submission errors:', errors);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Register Land" />
            <div className="px-4 py-6">
                <Heading
                    className="mb-7 flex w-full flex-col justify-center text-center"
                    title="Register new lands"
                    description="Add new lands for this planter"
                />
                {showModal && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <h2>Success!</h2>
                            <p>Land has been registered.</p>
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

                    {lands.length > 0 && (
                        <div className="mt-4">
                            <h3 className="text-lg font-semibold">
                                Existing Lands
                            </h3>
                            {lands.map((land, index) => (
                                <div
                                    key={land.id}
                                    className="mt-2 grid grid-cols-1 gap-4 border bg-gray-50 bg-white p-4 md:grid-cols-2"
                                >
                                    <h4 className="col-span-2 font-medium">
                                        Land #{index + 1}
                                    </h4>
                                    <Field>
                                        <Label>Land Name</Label>
                                        <Input value={land.name} disabled />
                                    </Field>
                                    <Field>
                                        <Label>Address</Label>
                                        <Input value={land.address} disabled />
                                    </Field>
                                    <Field>
                                        <Label>Area (ha)</Label>
                                        <Input
                                            value={land.area_hectares}
                                            disabled
                                        />
                                    </Field>
                                    <Field>
                                        <Label>Distance from URC (km)</Label>
                                        <Input
                                            value={land.distance_from_urc}
                                            disabled
                                        />
                                    </Field>
                                    <Field>
                                        <Label>Status</Label>
                                        <Input
                                            value={
                                                land.is_active
                                                    ? 'Active'
                                                    : 'Inactive'
                                            }
                                            disabled
                                        />
                                    </Field>
                                </div>
                            ))}
                        </div>
                    )}

                    <h3 className="mt-6 text-lg font-semibold">New Lands</h3>

                    {landCount.map((landId, idx) => (
                        <NewLand
                            key={landId}
                            landId={idx}
                            land={data.lands[idx]}
                            onRemove={() => handleRemoveLand(landId)}
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
                        Add Land
                    </Button>

                    <div className="mt-6 flex justify-end gap-2">
                        <Link href={planterShow(planter.id).url}>
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                        </Link>
                        <Button
                            type="submit"
                            disabled={processing || data.lands.length === 0}
                        >
                            {processing ? 'Saving...' : 'Save Lands'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
