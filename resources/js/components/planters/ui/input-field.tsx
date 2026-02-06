import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import type { ChangeEvent } from 'react';

type Props = {
    label: string;
    htmlfor?: string;
    id?: string;
    name?: string;
    type?: string;
    placeholder: string;
    description?: string;
    value?: string;
    onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
    disabled?: boolean;
};

export function InputField({
    label,
    htmlfor = `input-field-${label}`,
    id = `input-field-${label}`,
    name,
    type = 'text',
    placeholder,
    description,
    value,
    onChange,
    disabled,
}: Props) {
    return (
        <Field>
            <FieldLabel htmlFor={htmlfor}>{label}</FieldLabel>
            <Input
                id={id}
                name={name}
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                disabled={disabled}
            />
            <FieldDescription>{description}</FieldDescription>
        </Field>
    );
}
