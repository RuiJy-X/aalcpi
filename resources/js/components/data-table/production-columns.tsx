// What data is shown for each column
'use client';

import { useEffect, useState, type ReactNode } from 'react';
import type { ColumnDef, Row } from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { ProductionRow } from '@/components/planters/planters-table-types';

import ProductionActions from './production-actions';
import ProductionStatusSelect from './production-status-select';

export type ProductionEditableField =
    | 'status'
    | 'planter_code'
    | 'hacienda_code'
    | 'trans_code'
    | 'crop_year'
    | 'composite_sugar_price'
    | 'composite_molasses_price'
    | 'gross_cw'
    | 'net_cw'
    | 'trucks'
    | 'theoretical_lkg'
    | 'actual_lkg'
    | 'pshr_net_lkg'
    | 'pdpa_lkg'
    | 'association_dues_lkg'
    | 'actual_mol'
    | 'pshr_net_mol'
    | 'pdpa_mol'
    | 'association_dues_mol'
    | 'transloading';

export type ProductionDraft = Partial<
    Record<ProductionEditableField, string | number | boolean | null>
>;

export type ProductionColumnsOptions = {
    isEditing?: boolean;
    onCellChange?: (
        productionId: string,
        field: ProductionEditableField,
        value: string | number | boolean | null,
    ) => void;
};

const formatPrice = (value: unknown) => {
    if (value === null || value === undefined || value === '') {
        return '-';
    }

    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric.toFixed(2) : '-';
};

const formatNumber = (value: unknown, digits = 2) => {
    if (value === null || value === undefined || value === '') {
        return '-';
    }

    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric.toFixed(digits) : '-';
};

function SortableHeader({
    label,
    column,
}: {
    label: string;
    column: {
        toggleSorting: (desc?: boolean) => void;
        getIsSorted: () => false | 'asc' | 'desc';
    };
}) {
    return (
        <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
            {label}
            <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
    );
}

function fieldAsString(
    production: ProductionRow,
    field: ProductionEditableField,
): string {
    const raw = production[field as keyof ProductionRow] as
        | string
        | number
        | boolean
        | null
        | undefined;

    if (raw === null || raw === undefined) {
        return '';
    }

    if (typeof raw === 'boolean') {
        return raw ? 'true' : 'false';
    }

    return String(raw);
}

/**
 * Local-state input so typing does not remount when parent drafts update.
 * Parent is notified for save payloads; columns must NOT depend on drafts.
 */
function EditableTextCell({
    row,
    field,
    isEditing,
    onCellChange,
    display,
    inputType = 'text',
    className,
}: {
    row: Row<ProductionRow>;
    field: ProductionEditableField;
    isEditing: boolean;
    onCellChange?: ProductionColumnsOptions['onCellChange'];
    display: ReactNode;
    inputType?: 'text' | 'number';
    className?: string;
}) {
    const production = row.original;
    const [value, setValue] = useState(() =>
        fieldAsString(production, field),
    );

    // Re-seed only when edit mode starts or the row identity changes — not on every keystroke parent re-render.
    useEffect(() => {
        if (isEditing) {
            setValue(fieldAsString(production, field));
        }
    }, [isEditing, production.id, field]);

    if (!isEditing || !onCellChange) {
        return (
            <div className="flex items-center">
                <div className={`ml-2 truncate ${className ?? ''}`}>
                    {display}
                </div>
            </div>
        );
    }

    return (
        <Input
            type={inputType}
            step={inputType === 'number' ? 'any' : undefined}
            value={value}
            onChange={(event) => {
                const next = event.target.value;
                setValue(next);
                onCellChange(String(production.id), field, next);
            }}
            onClick={(event) => event.stopPropagation()}
            onMouseDown={(event) => event.stopPropagation()}
            className="h-8 min-w-24"
        />
    );
}

function EditableStatusCell({
    production,
    isEditing,
    onCellChange,
}: {
    production: ProductionRow;
    isEditing: boolean;
    onCellChange?: ProductionColumnsOptions['onCellChange'];
}) {
    const [value, setValue] = useState(production.status ?? 'draft');

    useEffect(() => {
        if (isEditing) {
            setValue(production.status ?? 'draft');
        }
    }, [isEditing, production.id, production.status]);

    if (!isEditing || !onCellChange) {
        return <ProductionStatusSelect production={production} />;
    }

    return (
        <Select
            value={value}
            onValueChange={(next) => {
                setValue(next as 'draft' | 'completed');
                onCellChange(String(production.id), 'status', next);
            }}
        >
            <SelectTrigger
                className="w-[140px]"
                onClick={(event) => event.stopPropagation()}
                onMouseDown={(event) => event.stopPropagation()}
            >
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                </SelectGroup>
            </SelectContent>
        </Select>
    );
}

function EditableTransloadingCell({
    production,
    isEditing,
    onCellChange,
}: {
    production: ProductionRow;
    isEditing: boolean;
    onCellChange?: ProductionColumnsOptions['onCellChange'];
}) {
    const [value, setValue] = useState(Boolean(production.transloading));

    useEffect(() => {
        if (isEditing) {
            setValue(Boolean(production.transloading));
        }
    }, [isEditing, production.id, production.transloading]);

    if (!isEditing || !onCellChange) {
        return (
            <div className="flex items-center">
                <div className="ml-2 truncate">
                    {production.transloading === null ||
                    production.transloading === undefined
                        ? '-'
                        : production.transloading
                          ? 'Yes'
                          : 'No'}
                </div>
            </div>
        );
    }

    return (
        <Select
            value={value ? 'true' : 'false'}
            onValueChange={(next) => {
                const boolValue = next === 'true';
                setValue(boolValue);
                onCellChange(String(production.id), 'transloading', boolValue);
            }}
        >
            <SelectTrigger
                className="w-[100px]"
                onClick={(event) => event.stopPropagation()}
                onMouseDown={(event) => event.stopPropagation()}
            >
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="true">Yes</SelectItem>
                <SelectItem value="false">No</SelectItem>
            </SelectContent>
        </Select>
    );
}

export function createProductionColumns(
    options: ProductionColumnsOptions = {},
): ColumnDef<ProductionRow>[] {
    const { isEditing = false, onCellChange } = options;

    return [
        {
            id: 'select',
            size: 20,
            header: ({ table }) => (
                <Checkbox
                    checked={
                        table.getIsAllPageRowsSelected() ||
                        (table.getIsSomePageRowsSelected() && 'indeterminate')
                    }
                    onCheckedChange={(value) =>
                        table.toggleAllPageRowsSelected(!!value)
                    }
                    aria-label="Select all"
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    className="mr-2"
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                    aria-label="Select row"
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            accessorKey: 'status',
            header: ({ column }) => (
                <SortableHeader label="Status" column={column} />
            ),
            cell: ({ row }) => (
                <EditableStatusCell
                    production={row.original}
                    isEditing={isEditing}
                    onCellChange={onCellChange}
                />
            ),
        },
        {
            accessorKey: 'planter_code',
            header: ({ column }) => (
                <SortableHeader label="Planter Code" column={column} />
            ),
            cell: ({ row }) => (
                <EditableTextCell
                    row={row}
                    field="planter_code"
                    isEditing={isEditing}
                    onCellChange={onCellChange}
                    display={row.original.planter_code ?? '-'}
                />
            ),
        },
        {
            accessorKey: 'planter_name',
            header: ({ column }) => (
                <SortableHeader label="Planter Name" column={column} />
            ),
            cell: ({ row }) => (
                <div className="flex items-center">
                    <div className="ml-2 truncate">
                        {row.original.planter_name ?? '-'}
                    </div>
                </div>
            ),
        },
        {
            accessorKey: 'hacienda_code',
            header: ({ column }) => (
                <SortableHeader label="Hacienda Code" column={column} />
            ),
            cell: ({ row }) => (
                <EditableTextCell
                    row={row}
                    field="hacienda_code"
                    isEditing={isEditing}
                    onCellChange={onCellChange}
                    display={row.original.hacienda_code ?? '-'}
                />
            ),
        },
        {
            accessorKey: 'hacienda_name',
            header: ({ column }) => (
                <SortableHeader label="Hacienda Name" column={column} />
            ),
            cell: ({ row }) => (
                <div className="flex items-center">
                    <div className="ml-2 truncate">
                        {row.original.hacienda_name ?? '-'}
                    </div>
                </div>
            ),
        },
        {
            accessorKey: 'trans_code',
            header: ({ column }) => (
                <SortableHeader label="Trans Code" column={column} />
            ),
            cell: ({ row }) => (
                <EditableTextCell
                    row={row}
                    field="trans_code"
                    isEditing={isEditing}
                    onCellChange={onCellChange}
                    display={row.original.trans_code ?? '-'}
                />
            ),
        },
        {
            accessorKey: 'crop_year',
            header: ({ column }) => (
                <SortableHeader label="Crop Year" column={column} />
            ),
            cell: ({ row }) => (
                <EditableTextCell
                    row={row}
                    field="crop_year"
                    isEditing={isEditing}
                    onCellChange={onCellChange}
                    display={
                        row.original.crop_year ?? 'No crop year assigned'
                    }
                    className={row.original.crop_year ? '' : 'text-red-500'}
                />
            ),
        },
        {
            accessorKey: 'composite_sugar_price',
            header: ({ column }) => (
                <SortableHeader
                    label="Composite Sugar Price"
                    column={column}
                />
            ),
            cell: ({ row }) => (
                <EditableTextCell
                    row={row}
                    field="composite_sugar_price"
                    isEditing={isEditing}
                    onCellChange={onCellChange}
                    display={formatPrice(row.original.composite_sugar_price)}
                    inputType="number"
                />
            ),
        },
        {
            accessorKey: 'composite_molasses_price',
            header: ({ column }) => (
                <SortableHeader
                    label="Composite Molasses Price"
                    column={column}
                />
            ),
            cell: ({ row }) => (
                <EditableTextCell
                    row={row}
                    field="composite_molasses_price"
                    isEditing={isEditing}
                    onCellChange={onCellChange}
                    display={formatPrice(row.original.composite_molasses_price)}
                    inputType="number"
                />
            ),
        },
        {
            accessorKey: 'gross_cw',
            header: ({ column }) => (
                <SortableHeader label="Gross CW" column={column} />
            ),
            cell: ({ row }) => (
                <EditableTextCell
                    row={row}
                    field="gross_cw"
                    isEditing={isEditing}
                    onCellChange={onCellChange}
                    display={formatNumber(row.original.gross_cw)}
                    inputType="number"
                />
            ),
        },
        {
            accessorKey: 'net_cw',
            header: ({ column }) => (
                <SortableHeader label="Net CW" column={column} />
            ),
            cell: ({ row }) => (
                <EditableTextCell
                    row={row}
                    field="net_cw"
                    isEditing={isEditing}
                    onCellChange={onCellChange}
                    display={formatNumber(row.original.net_cw)}
                    inputType="number"
                />
            ),
            meta: {
                color: '#d1edfa',
            },
        },
        {
            accessorKey: 'trucks',
            header: ({ column }) => (
                <SortableHeader label="Trucks" column={column} />
            ),
            cell: ({ row }) => (
                <EditableTextCell
                    row={row}
                    field="trucks"
                    isEditing={isEditing}
                    onCellChange={onCellChange}
                    display={row.original.trucks}
                    inputType="number"
                />
            ),
        },
        {
            accessorKey: 'theoretical_lkg',
            header: ({ column }) => (
                <SortableHeader label="Theoretical LKG" column={column} />
            ),
            cell: ({ row }) => (
                <EditableTextCell
                    row={row}
                    field="theoretical_lkg"
                    isEditing={isEditing}
                    onCellChange={onCellChange}
                    display={formatNumber(row.original.theoretical_lkg)}
                    inputType="number"
                />
            ),
        },
        {
            accessorKey: 'actual_lkg',
            header: ({ column }) => (
                <SortableHeader label="Actual LKG" column={column} />
            ),
            cell: ({ row }) => (
                <EditableTextCell
                    row={row}
                    field="actual_lkg"
                    isEditing={isEditing}
                    onCellChange={onCellChange}
                    display={formatNumber(row.original.actual_lkg)}
                    inputType="number"
                />
            ),
            meta: {
                color: '#ffb061',
            },
        },
        {
            accessorKey: 'pshr_net_lkg',
            header: ({ column }) => (
                <SortableHeader label="PSHR Net LKG" column={column} />
            ),
            cell: ({ row }) => (
                <EditableTextCell
                    row={row}
                    field="pshr_net_lkg"
                    isEditing={isEditing}
                    onCellChange={onCellChange}
                    display={formatNumber(row.original.pshr_net_lkg)}
                    inputType="number"
                />
            ),
            meta: {
                color: '#ffe8d1',
            },
        },
        {
            accessorKey: 'pdpa_lkg',
            header: ({ column }) => (
                <SortableHeader label="PDPA LKG" column={column} />
            ),
            cell: ({ row }) => (
                <EditableTextCell
                    row={row}
                    field="pdpa_lkg"
                    isEditing={isEditing}
                    onCellChange={onCellChange}
                    display={formatNumber(row.original.pdpa_lkg)}
                    inputType="number"
                />
            ),
        },
        {
            accessorKey: 'association_dues_lkg',
            header: ({ column }) => (
                <SortableHeader label="Assoc Dues LKG" column={column} />
            ),
            cell: ({ row }) => (
                <EditableTextCell
                    row={row}
                    field="association_dues_lkg"
                    isEditing={isEditing}
                    onCellChange={onCellChange}
                    display={formatNumber(row.original.association_dues_lkg)}
                    inputType="number"
                />
            ),
        },
        {
            accessorKey: 'actual_mol',
            header: ({ column }) => (
                <SortableHeader label="Actual MOL" column={column} />
            ),
            cell: ({ row }) => (
                <EditableTextCell
                    row={row}
                    field="actual_mol"
                    isEditing={isEditing}
                    onCellChange={onCellChange}
                    display={formatNumber(row.original.actual_mol, 3)}
                    inputType="number"
                />
            ),
            meta: {
                color: '#9bf88e',
            },
        },
        {
            accessorKey: 'pshr_net_mol',
            header: ({ column }) => (
                <SortableHeader label="PSHR Net MOL" column={column} />
            ),
            cell: ({ row }) => (
                <EditableTextCell
                    row={row}
                    field="pshr_net_mol"
                    isEditing={isEditing}
                    onCellChange={onCellChange}
                    display={formatNumber(row.original.pshr_net_mol, 3)}
                    inputType="number"
                />
            ),
            meta: {
                color: '#b8f7b0',
            },
        },
        {
            accessorKey: 'pdpa_mol',
            header: ({ column }) => (
                <SortableHeader label="PDPA MOL" column={column} />
            ),
            cell: ({ row }) => (
                <EditableTextCell
                    row={row}
                    field="pdpa_mol"
                    isEditing={isEditing}
                    onCellChange={onCellChange}
                    display={formatNumber(row.original.pdpa_mol)}
                    inputType="number"
                />
            ),
        },
        {
            accessorKey: 'association_dues_mol',
            header: ({ column }) => (
                <SortableHeader label="Assoc Dues MOL" column={column} />
            ),
            cell: ({ row }) => (
                <EditableTextCell
                    row={row}
                    field="association_dues_mol"
                    isEditing={isEditing}
                    onCellChange={onCellChange}
                    display={formatNumber(row.original.association_dues_mol)}
                    inputType="number"
                />
            ),
        },
        {
            accessorKey: 'transloading',
            header: ({ column }) => (
                <SortableHeader label="Transloading" column={column} />
            ),
            cell: ({ row }) => (
                <EditableTransloadingCell
                    production={row.original}
                    isEditing={isEditing}
                    onCellChange={onCellChange}
                />
            ),
            filterFn: (row, columnId, filterValue) => {
                const rowValue = row.getValue(columnId);
                if (!filterValue) {
                    return true;
                }

                if (Array.isArray(filterValue)) {
                    return filterValue
                        .map((value) => String(value))
                        .includes(String(rowValue));
                }

                return String(rowValue) === String(filterValue);
            },
            meta: {
                label: 'Transloading',
                filterOptions: [
                    { label: 'All', value: '' },
                    { label: 'Yes', value: 'true' },
                    { label: 'No', value: 'false' },
                ],
            },
        },
        {
            accessorKey: 'created_at',
            header: ({ column }) => (
                <SortableHeader label="Created At" column={column} />
            ),
            cell: ({ row }) => (
                <div className="flex items-center">
                    <div className="ml-2 truncate">
                        {row.original.created_at?.split('T')[0]}
                    </div>
                </div>
            ),
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => (
                <ProductionActions production={row.original} />
            ),
        },
    ];
}

/** Default read-only columns (used on planter views, etc.). */
export const productionColumns = createProductionColumns();
