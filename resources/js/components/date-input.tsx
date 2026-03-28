'use client';

import * as React from 'react';
import { CalendarIcon } from 'lucide-react';

import { Calendar } from '@/components/ui/calendar';
import { Field, FieldLabel } from '@/components/ui/field';
import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupInput,
} from '@/components/ui/input-group';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';

function formatDate(date: Date | undefined) {
    if (!date) {
        return '';
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function isValidDate(date: Date | undefined) {
    if (!date) {
        return false;
    }
    return !isNaN(date.getTime());
}

function parseDate(value: string): Date | undefined {
    if (!value) {
        return undefined;
    }

    const parsed = new Date(value);
    if (!isValidDate(parsed)) {
        return undefined;
    }

    return parsed;
}

type DateInputProps = {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    required?: boolean;
};

export function DateInput({
    id,
    label,
    value,
    onChange,
    placeholder = 'YYYY-MM-DD',
    className = 'w-full',
    disabled = false,
    required = false,
}: DateInputProps) {
    const [open, setOpen] = React.useState(false);
    const selectedDate = React.useMemo(() => parseDate(value), [value]);
    const [month, setMonth] = React.useState<Date | undefined>(selectedDate);

    React.useEffect(() => {
        if (selectedDate) {
            setMonth(selectedDate);
        }
    }, [selectedDate]);

    return (
        <Field className={className}>
            <FieldLabel htmlFor={id}>{label}</FieldLabel>
            <InputGroup>
                <InputGroupInput
                    id={id}
                    value={value}
                    placeholder={placeholder}
                    disabled={disabled}
                    required={required}
                    onChange={(e) => {
                        const nextValue = e.target.value;
                        const date = parseDate(nextValue);
                        onChange(nextValue);

                        if (isValidDate(date)) {
                            setMonth(date);
                        }
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            setOpen(true);
                        }
                    }}
                />
                <InputGroupAddon align="inline-end">
                    <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                            <InputGroupButton
                                id={`${id}-picker`}
                                variant="ghost"
                                size="icon-xs"
                                aria-label="Select date"
                                disabled={disabled}
                            >
                                <CalendarIcon />
                                <span className="sr-only">Select date</span>
                            </InputGroupButton>
                        </PopoverTrigger>
                        <PopoverContent
                            className="w-auto overflow-hidden p-0"
                            align="end"
                            alignOffset={-8}
                            sideOffset={10}
                        >
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                month={month}
                                onMonthChange={setMonth}
                                onSelect={(date) => {
                                    onChange(formatDate(date));
                                    setOpen(false);
                                }}
                            />
                        </PopoverContent>
                    </Popover>
                </InputGroupAddon>
            </InputGroup>
        </Field>
    );
}

export function DatePickerInput({
    label,
    value,
    onChange,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
}) {
    return (
        <DateInput
            id={label.toLowerCase().replace(/\s+/g, '-')}
            label={label}
            value={value}
            onChange={onChange}
        />
    );
}
