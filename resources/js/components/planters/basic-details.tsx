import { Mail, Phone } from 'lucide-react';
import React from 'react';
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
} from '@/components/ui/input-group';
import { Field } from '../ui/field';
import { Label } from '../ui/label';
import { usePlanterForm } from './planter-forms';
import { InputField } from './ui/input-field';

const BasicDetails = () => {
    const { data, setData } = usePlanterForm();

    return (
        <div className="mb-2 self-center">
            <h1 className="py-2 text-xl font-bold text-foreground">
                Basic Details
            </h1>
            <div className="px-5 py-2 text-foreground">
                <InputField
                    label="Name"
                    description=""
                    placeholder="Name"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                />
                <InputField
                    label="Address"
                    placeholder="Address"
                    value={data.address}
                    onChange={(e) => setData('address', e.target.value)}
                />
                <div className="grid grid-cols-2 gap-5">
                    <div>
                        <Field>
                            <Label>Tin Number</Label>
                            <InputGroup>
                                <InputGroupAddon>
                                    <Mail className="size-4" />
                                </InputGroupAddon>
                                <InputGroupInput
                                    placeholder="TIN Number"
                                    value={data.tin_number}
                                    onChange={(e) =>
                                        setData('tin_number', e.target.value)
                                    }
                                />
                            </InputGroup>
                        </Field>
                    </div>
                    <div>
                        <Field>
                            <Label>Phone</Label>
                            <InputGroup>
                                <InputGroupAddon>
                                    <Phone className="size-4" />
                                </InputGroupAddon>
                                <InputGroupInput
                                    placeholder="09XXXXXXXXX"
                                    value={data.phone}
                                    onChange={(e) =>
                                        setData('phone', e.target.value)
                                    }
                                />
                            </InputGroup>
                        </Field>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BasicDetails;
