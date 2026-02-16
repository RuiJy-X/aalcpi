'use client';

import { MapPin } from 'lucide-react';
import React from 'react';
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
} from '@/components/ui/input-group';
import { Field } from '../ui/field';
import { Label } from '../ui/label';
import { usePlanterForm } from './planter-forms';
import { ComboboxStatus, ComboboxOwnership } from './ui/combo-box';
import { InputField } from './ui/input-field';

const HaciendaDetails = () => {
    const { data, setData } = usePlanterForm();

    return (
        <div className="mb-2 self-center">
            <h1 className="py-2 text-xl font-bold text-foreground">
                Hacienda Details
            </h1>
            <div className="px-5 py-2 text-foreground">
                <InputField
                    label="Hacienda Name"
                    description=""
                    placeholder="Hacienda Name"
                    value={data.haciendaName}
                    onChange={(e) => setData('haciendaName', e.target.value)}
                />
                <div>
                    <Field>
                        <Label>Location</Label>
                        <InputGroup>
                            <InputGroupAddon>
                                <MapPin className="size-4" />
                            </InputGroupAddon>
                            <InputGroupInput
                                placeholder="Hacienda Location"
                                value={data.location}
                                onChange={(e) =>
                                    setData('location', e.target.value)
                                }
                            />
                        </InputGroup>
                    </Field>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-5">
                    <Field>
                        <Label>Status</Label>
                        <ComboboxStatus
                            value={data.status}
                            onValueChange={(value) => setData('status', value)}
                        />
                    </Field>
                    <Field>
                        <Label>Ownership Type</Label>
                        <ComboboxOwnership
                            value={data.ownershipType}
                            onValueChange={(value) =>
                                setData('ownershipType', value)
                            }
                        />
                    </Field>
                </div>
            </div>
        </div>
    );
};

export default HaciendaDetails;
