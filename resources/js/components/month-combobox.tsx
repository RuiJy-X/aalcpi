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
export default function MonthComboBox({ value, onValueChange }: ComboBoxProps) {
    const items = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
    ];
    return (
        <Combobox items={items}>
            <ComboboxInput
                placeholder="Month"
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
