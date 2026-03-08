import type { Column, ColumnFiltersState } from '@tanstack/react-table';
import type { Dispatch, SetStateAction } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type FilterValue = string | number | boolean;
type FilterSelection = FilterValue | FilterValue[] | '';

interface FilterProps<TData, TValue> {
    column: Column<TData, TValue>;
    columnFilters: ColumnFiltersState;
    setColumnFilters: Dispatch<SetStateAction<ColumnFiltersState>>;
}

export default function Filter<TData, TValue>({
    column,
    columnFilters,
    setColumnFilters,
}: FilterProps<TData, TValue>) {
    const columnFilterValue = columnFilters.find(
        (filter) => filter.id === column.id,
    )?.value;

    const filterOptions = column.columnDef.meta?.filterOptions;
    const selectedValues = Array.isArray(columnFilterValue)
        ? columnFilterValue
        : columnFilterValue === undefined || columnFilterValue === ''
          ? []
          : [columnFilterValue as FilterValue];

    const selectedOptions = filterOptions?.filter((option) =>
        selectedValues.includes(option.value),
    );

    const onFilterChange = (id: string, value: FilterSelection) => {
        setColumnFilters((prev) => {
            const nextFilters = prev.filter((filter) => filter.id !== id);

            if (!value || (Array.isArray(value) && value.length === 0)) {
                return nextFilters;
            }

            return nextFilters.concat({ id, value });
        });
    };

    const buttonLabel = selectedOptions?.length
        ? selectedOptions.length === 1
            ? selectedOptions[0].label
            : `${selectedOptions.length} selected`
        : 'Filter';

    if (filterOptions?.length) {
        return (
            <div className="flex flex-col gap-2 py-4">
                <Label className="text-start text-foreground capitalize">
                    {column.columnDef.meta?.label || 'Filter'}
                </Label>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="outline"
                            className="w-full text-gray-500 capitalize"
                        >
                            {buttonLabel}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                        {filterOptions.map((option) => (
                            <DropdownMenuCheckboxItem
                                key={String(option.value)}
                                checked={
                                    option.value === ''
                                        ? selectedValues.length === 0
                                        : selectedValues.includes(option.value)
                                }
                                onSelect={(event) => event.preventDefault()}
                                onCheckedChange={(checked) => {
                                    if (option.value === '') {
                                        onFilterChange(column.id, '');
                                        return;
                                    }

                                    if (checked) {
                                        onFilterChange(column.id, [
                                            ...selectedValues.filter(
                                                (value) => value !== '',
                                            ),
                                            option.value,
                                        ]);
                                        return;
                                    }

                                    const nextValues = selectedValues.filter(
                                        (value) => value !== option.value,
                                    );

                                    onFilterChange(
                                        column.id,
                                        nextValues.length ? nextValues : '',
                                    );
                                }}
                            >
                                <div>{option.label}</div>
                            </DropdownMenuCheckboxItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2 py-4">
            <Label className="text-start capitalize">
                {column.id.replaceAll('_', ' ')}
            </Label>
            <Input
                placeholder={`Filter ${column.id.replaceAll('_', ' ')}...`}
                value={
                    typeof columnFilterValue === 'string'
                        ? columnFilterValue
                        : ''
                }
                onChange={(event) =>
                    onFilterChange(column.id, event.target.value)
                }
                className="max-w-sm"
            />
        </div>
    );
}
