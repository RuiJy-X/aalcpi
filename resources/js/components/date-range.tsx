'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { type DateRange } from 'react-day-picker';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Field } from '@/components/ui/field';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';

type DatePickerWithRangeProps = {
    value?: DateRange;
    onChange?: (value: DateRange | undefined) => void;
    className?: string;
};

export function DatePickerWithRange({
    value,
    onChange,
    className = 'w-60',
}: DatePickerWithRangeProps) {
    const [internalDate, setInternalDate] = React.useState<DateRange>();
    const date = value ?? internalDate;

    const handleSelect = React.useCallback(
        (nextDate: DateRange | undefined) => {
            if (onChange) {
                onChange(nextDate);
                return;
            }

            setInternalDate(nextDate);
            console.log('Selected date range:', nextDate);
        },
        [onChange],
    );

    return (
        <Field className={className}>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        id="date-picker-range"
                        className="justify-start px-2.5 font-normal"
                    >
                        <CalendarIcon />
                        {date?.from ? (
                            date.to ? (
                                <>
                                    {format(date.from, 'LLL dd, y')} -{' '}
                                    {format(date.to, 'LLL dd, y')}
                                </>
                            ) : (
                                format(date.from, 'LLL dd, y')
                            )
                        ) : (
                            <span>Pick a date</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="range"
                        defaultMonth={date?.from}
                        selected={date}
                        onSelect={handleSelect}
                        captionLayout="dropdown"
                        numberOfMonths={2}
                    />
                </PopoverContent>
            </Popover>
        </Field>
    );
}
