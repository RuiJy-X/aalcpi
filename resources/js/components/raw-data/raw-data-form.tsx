import { type FormEvent, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Field, FieldGroup } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { RawDataFormData } from './raw-data-types';

type RawDataFieldKey = keyof RawDataFormData;

type RawDataField = {
    key: RawDataFieldKey;
    label: string;
    type: 'text' | 'date' | 'number';
    placeholder?: string;
    step?: string;
};

const rawDataFields: RawDataField[] = [
    {
        key: 'crop_year',
        label: 'Crop Year',
        type: 'text',
        placeholder: '2025-2026',
    },
    {
        key: 'date',
        label: 'Date',
        type: 'date',
    },
    {
        key: 'planter_code',
        label: 'Planter Code',
        type: 'text',
        placeholder: 'P-000001',
    },
    {
        key: 'gross_cw',
        label: 'Gross CW',
        type: 'number',
        step: '0.001',
    },
    {
        key: 'net_cw',
        label: 'Net CW',
        type: 'number',
        step: '0.001',
    },
    {
        key: 'trucks',
        label: 'Trucks',
        type: 'number',
        step: '1',
    },
    {
        key: 'theoretical_lkg',
        label: 'Theoretical LKG',
        type: 'number',
        step: '0.001',
    },
    {
        key: 'actual_lkg',
        label: 'Actual LKG',
        type: 'number',
        step: '0.001',
    },
    {
        key: 'calculated_sugar',
        label: 'Calculated Sugar',
        type: 'number',
        step: '0.001',
    },
    {
        key: 'trash',
        label: 'Trash',
        type: 'number',
        step: '0.001',
    },
    {
        key: 'Lkg_per_TC',
        label: 'Lkg per TC',
        type: 'number',
        step: '0.001',
    },
];

interface RawDataFormProps {
    data: RawDataFormData;
    setData: (key: RawDataFieldKey, value: string) => void;
    errors: Partial<Record<RawDataFieldKey, string>> & Record<string, string>;
    processing: boolean;
    submitLabel: string;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    onCancel: () => void;
}

export default function RawDataForm({
    data,
    setData,
    errors,
    processing,
    submitLabel,
    onSubmit,
    onCancel,
}: RawDataFormProps) {
    useEffect(() => {
        let cancelled = false;

        const gross = parseFloat(String(data.gross_cw || '0'));
        const lkg = parseFloat(String(data.Lkg_per_TC || '0'));
        const date = data.date;

        if (!date || Number.isNaN(gross) || Number.isNaN(lkg)) {
            return;
        }

        (async () => {
            try {
                const resp = await fetch(`/MillingPeriods/sugar-factor?date=${encodeURIComponent(
                    date
                )}`);
                const json = resp.ok ? await resp.json() : { sugar_factor: 1 };
                const factor = Number(json.sugar_factor ?? 1) || 1;
                const calculated = gross * lkg * factor;
                const rounded = Number.isFinite(calculated) ? calculated.toFixed(3) : '0.000';
                if (!cancelled) setData('calculated_sugar', rounded);
            } catch (e) {
                const calculated = gross * lkg * 1;
                if (!cancelled) setData('calculated_sugar', Number.isFinite(calculated) ? calculated.toFixed(3) : '0.000');
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [data.gross_cw, data.Lkg_per_TC, data.date]);
    return (
        <form onSubmit={onSubmit} className="space-y-6">
            <FieldGroup className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {rawDataFields.map((field) => (
                    <Field key={field.key}>
                        <Label htmlFor={field.key}>{field.label}</Label>
                        <Input
                            id={field.key}
                            type={field.type}
                            placeholder={field.placeholder}
                            step={field.step}
                            value={data[field.key]}
                            onChange={(event) =>
                                setData(field.key, event.target.value)
                            }
                        />
                        {errors[field.key] && (
                            <p className="text-sm text-red-500">
                                {errors[field.key]}
                            </p>
                        )}
                    </Field>
                ))}
            </FieldGroup>

            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" disabled={processing}>
                    {processing ? 'Saving...' : submitLabel}
                </Button>
            </div>
        </form>
    );
}
