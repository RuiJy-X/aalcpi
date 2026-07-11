import type { Column, ColumnFiltersState } from '@tanstack/react-table';
import type { Dispatch, SetStateAction } from 'react';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

type FilterValue = string | number | boolean;
type FilterSelection = FilterValue | FilterValue[] | '';
const CROP_YEAR_TYPING_PATTERN = /^\d{0,4}(-\d{0,4})?$/;
const CROP_YEAR_COMPLETE_PATTERN = /^\d{4}-\d{4}$/;

interface FilterProps<TData, TValue> {
    column: Column<TData, TValue>;
    columnFilters: ColumnFiltersState;
    setColumnFilters: Dispatch<SetStateAction<ColumnFiltersState>>;
}

// This filter accepts the column of the table and the current column filters state, and a function to update the column filters state. It checks if the column has filter options defined in its meta, and if so, it renders a dropdown menu with those options. If not, it renders a text input for filtering. The filter values are stored in the column filters state, which is an array of objects with id and value properties. The id corresponds to the column id, and the value is the filter value for that column.
export default function Filter<TData, TValue>({
    column,
    columnFilters,
    setColumnFilters,
}: FilterProps<TData, TValue>) {
    // Find the current filter value for this column from the column filters state
    const columnFilterValue = columnFilters.find(
        (filter) => filter.id === column.id,
    )?.value;

    // Get the filter options from the column meta, if defined. The filter options should be an array of objects with label and value properties. Ex. Status is either Active or Inactive but their value  is actually true or false, so the filter options will be [{ label: 'Active', value: 'true' }, { label: 'Inactive', value: 'false' }]
    const filterOptions = column.columnDef.meta?.filterOptions;

    // If the filter value is an array, use it as is. If it's a single value, convert it to an array. If it's undefined or empty string, use an empty array. This will help us to handle both single and multiple selection filters in a consistent way.
    const selectedValues = Array.isArray(columnFilterValue)
        ? columnFilterValue
        : columnFilterValue === undefined || columnFilterValue === ''
          ? []
          : [columnFilterValue as FilterValue];

    // For each options defined, if its selected append the value. So we know which options are selected.
    const selectedOptions = filterOptions?.filter((option) =>
        selectedValues.includes(option.value),
    );

    const onFilterChange = (id: string, value: FilterSelection) => {
        setColumnFilters((prev) => {
            //Remove the filter object
            const nextFilters = prev.filter((filter) => filter.id !== id);

            // If there is no value then return the deleted filter
            if (!value || (Array.isArray(value) && value.length === 0)) {
                return nextFilters;
            }

            // Else append the filter object to the filter array
            return nextFilters.concat({ id, value });
        });
    };

    const buttonLabel = selectedOptions?.length
        ? selectedOptions.length === 1
            ? selectedOptions[0].label
            : `${selectedOptions.length} selected`
        : 'Filter';

    const isCropYearColumn = column.id.toLowerCase() === 'crop_year';

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
                type="text"
                placeholder={
                    isCropYearColumn
                        ? 'Filter crop year (YYYY-YYYY)...'
                        : `Filter ${column.id.replaceAll('_', ' ')}...`
                }
                value={
                    typeof columnFilterValue === 'string'
                        ? columnFilterValue
                        : ''
                }
                maxLength={isCropYearColumn ? 9 : undefined}
                onChange={(event) => {
                    const nextValue = event.target.value;

                    if (!isCropYearColumn) {
                        onFilterChange(column.id, nextValue);
                        return;
                    }

                    if (
                        nextValue === '' ||
                        CROP_YEAR_TYPING_PATTERN.test(nextValue)
                    ) {
                        onFilterChange(column.id, nextValue);
                    }
                }}
                onBlur={(event) => {
                    if (!isCropYearColumn) {
                        return;
                    }

                    const value = event.target.value;

                    if (
                        value !== '' &&
                        !CROP_YEAR_COMPLETE_PATTERN.test(value)
                    ) {
                        onFilterChange(column.id, '');
                    }
                }}
                className="max-w-sm"
            />
        </div>
    );
}
