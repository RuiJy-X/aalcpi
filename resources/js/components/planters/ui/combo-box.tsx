import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from '@/components/ui/combobox';

type ComboBoxProps = {
    items?: Array<string>;
    value?: string;
    onValueChange?: (value: string) => void;
};

const ownership = ['Owner', 'Rent'];
const status = ['Active', 'Inactive'];

export function ComboboxStatus({ value, onValueChange }: ComboBoxProps) {
    return (
        <Combobox items={status}>
            <ComboboxInput
                placeholder="Status"
                value={value ?? ''}
                onChange={(e) => onValueChange?.(e.target.value)}
            />
            <ComboboxContent>
                <ComboboxEmpty>No items found.</ComboboxEmpty>
                <ComboboxList>
                    {(item) => (
                        <ComboboxItem
                            key={item}
                            value={item}
                            onClick={() => onValueChange?.(item)}
                        >
                            {item}
                        </ComboboxItem>
                    )}
                </ComboboxList>
            </ComboboxContent>
        </Combobox>
    );
}

export function ComboboxOwnership({ value, onValueChange }: ComboBoxProps) {
    return (
        <Combobox items={ownership}>
            <ComboboxInput
                placeholder="Ownership Type"
                value={value ?? ''}
                onChange={(e) => onValueChange?.(e.target.value)}
            />
            <ComboboxContent>
                <ComboboxEmpty>No items found.</ComboboxEmpty>
                <ComboboxList>
                    {(item) => (
                        <ComboboxItem
                            key={item}
                            value={item}
                            onClick={() => onValueChange?.(item)}
                        >
                            {item}
                        </ComboboxItem>
                    )}
                </ComboboxList>
            </ComboboxContent>
        </Combobox>
    );
}
