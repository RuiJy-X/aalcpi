'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

export type CellChangeHandler = (
    rowId: string,
    field: string,
    value: string | number | boolean | null,
) => void;

function toDisplayString(value: unknown): string {
    if (value === null || value === undefined) {
        return '';
    }
    if (typeof value === 'boolean') {
        return value ? 'true' : 'false';
    }
    return String(value);
}

/**
 * Local-state text/number input. Parent drafts update for Save only —
 * columns must not depend on draft state (avoids focus loss).
 */
export function EditableTextCell({
    rowId,
    field,
    isEditing,
    value,
    display,
    onCellChange,
    inputType = 'text',
    className,
}: {
    rowId: string | number;
    field: string;
    isEditing: boolean;
    value: unknown;
    display: ReactNode;
    onCellChange?: CellChangeHandler;
    inputType?: 'text' | 'number' | 'date' | 'time';
    className?: string;
}) {
    const [local, setLocal] = useState(() => toDisplayString(value));

    useEffect(() => {
        if (isEditing) {
            setLocal(toDisplayString(value));
        }
    }, [isEditing, rowId, field]);

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
            value={local}
            onChange={(event) => {
                const next = event.target.value;
                setLocal(next);
                onCellChange(String(rowId), field, next);
            }}
            onClick={(event) => event.stopPropagation()}
            onMouseDown={(event) => event.stopPropagation()}
            className="h-8 min-w-24"
        />
    );
}

export function EditableSelectCell({
    rowId,
    field,
    isEditing,
    value,
    display,
    options,
    onCellChange,
    className,
}: {
    rowId: string | number;
    field: string;
    isEditing: boolean;
    value: unknown;
    display: ReactNode;
    options: { label: string; value: string }[];
    onCellChange?: CellChangeHandler;
    className?: string;
}) {
    const [local, setLocal] = useState(() => toDisplayString(value));

    useEffect(() => {
        if (isEditing) {
            setLocal(toDisplayString(value));
        }
    }, [isEditing, rowId, field]);

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
        <Select
            value={local}
            onValueChange={(next) => {
                setLocal(next);
                onCellChange(String(rowId), field, next);
            }}
        >
            <SelectTrigger
                className={`h-8 min-w-28 ${className ?? ''}`}
                onClick={(event) => event.stopPropagation()}
                onMouseDown={(event) => event.stopPropagation()}
            >
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                {options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

export function EditableBooleanCell({
    rowId,
    field,
    isEditing,
    value,
    trueLabel = 'Yes',
    falseLabel = 'No',
    onCellChange,
}: {
    rowId: string | number;
    field: string;
    isEditing: boolean;
    value: unknown;
    trueLabel?: string;
    falseLabel?: string;
    onCellChange?: CellChangeHandler;
}) {
    const boolValue = Boolean(value);

    return (
        <EditableSelectCell
            rowId={rowId}
            field={field}
            isEditing={isEditing}
            value={boolValue ? 'true' : 'false'}
            display={
                value === null || value === undefined
                    ? '-'
                    : boolValue
                      ? trueLabel
                      : falseLabel
            }
            options={[
                { label: trueLabel, value: 'true' },
                { label: falseLabel, value: 'false' },
            ]}
            onCellChange={
                onCellChange
                    ? (id, f, v) => onCellChange(id, f, v === 'true')
                    : undefined
            }
        />
    );
}
