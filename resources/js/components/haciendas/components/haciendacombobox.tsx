import React from 'react';
import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from '@/components/ui/combobox';

export default function HaciendaCombobox({
    items,
    value,
    onValueChange,
}: {
    items: string[];
    value: string | undefined;
    onValueChange: (value: string) => void;
}) {
    return (
        <Combobox
            items={items}
            value={value}
            onValueChange={(val) => {
                if (val != null) onValueChange(val);
            }}
        >
            <ComboboxInput placeholder="Name" />
            <ComboboxContent>
                <ComboboxEmpty>No items found.</ComboboxEmpty>
                <ComboboxList>
                    {(item) => (
                        <ComboboxItem key={item} value={item}>
                            {item}
                        </ComboboxItem>
                    )}
                </ComboboxList>
            </ComboboxContent>
        </Combobox>
    );
}
