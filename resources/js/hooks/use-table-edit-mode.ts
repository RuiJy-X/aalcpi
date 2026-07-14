import { router } from '@inertiajs/react';
import { useCallback, useMemo, useRef, useState } from 'react';

export type TableDraft = Record<string, string | number | boolean | null>;

type UseTableEditModeOptions<T extends { id: string | number }> = {
    rows: T[];
    /** Fields included in edit drafts / save payload. */
    fields: string[];
    saveUrl: string;
    numericFields?: string[];
    booleanFields?: string[];
    /** Optional per-field initial value override. */
    getInitialValue?: (row: T, field: string) => string | number | boolean | null;
};

/**
 * Shared edit-mode state for datatables: Edit → cell inputs → Save bulk PATCH.
 * Keeps column defs stable (no drafts dependency) so inputs keep focus.
 */
export function useTableEditMode<T extends { id: string | number }>({
    rows,
    fields,
    saveUrl,
    numericFields = [],
    booleanFields = [],
    getInitialValue,
}: UseTableEditModeOptions<T>) {
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [drafts, setDrafts] = useState<Record<string, TableDraft>>({});

    const isEditingRef = useRef(false);
    isEditingRef.current = isEditing;
    const draftsRef = useRef(drafts);
    draftsRef.current = drafts;

    const numericSet = useMemo(() => new Set(numericFields), [numericFields]);
    const booleanSet = useMemo(() => new Set(booleanFields), [booleanFields]);

    const startEditing = useCallback(() => {
        const initial: Record<string, TableDraft> = {};

        rows.forEach((row) => {
            const draft: TableDraft = {};
            fields.forEach((field) => {
                if (getInitialValue) {
                    draft[field] = getInitialValue(row, field);
                    return;
                }

                const raw = (row as Record<string, unknown>)[field];
                if (booleanSet.has(field)) {
                    draft[field] = Boolean(raw);
                    return;
                }
                if (raw === null || raw === undefined) {
                    draft[field] = '';
                    return;
                }
                draft[field] = String(raw);
            });
            initial[String(row.id)] = draft;
        });

        draftsRef.current = initial;
        setDrafts(initial);
        setIsEditing(true);
    }, [rows, fields, getInitialValue, booleanSet]);

    const cancelEditing = useCallback(() => {
        setIsEditing(false);
        draftsRef.current = {};
        setDrafts({});
    }, []);

    const handleCellChange = useCallback(
        (
            rowId: string,
            field: string,
            value: string | number | boolean | null,
        ) => {
            const next = {
                ...draftsRef.current,
                [rowId]: {
                    ...(draftsRef.current[rowId] ?? {}),
                    [field]: value,
                },
            };
            draftsRef.current = next;
            setDrafts(next);
        },
        [],
    );

    const saveEdits = useCallback(() => {
        const currentDrafts = draftsRef.current;
        const payloadRows = Object.entries(currentDrafts).map(([id, draft]) => {
            const payload: Record<string, unknown> = { id: Number(id) };

            Object.entries(draft).forEach(([field, value]) => {
                if (booleanSet.has(field)) {
                    payload[field] =
                        value === true ||
                        value === 'true' ||
                        value === 1 ||
                        value === '1';
                    return;
                }

                if (numericSet.has(field)) {
                    if (value === '' || value === null || value === undefined) {
                        payload[field] = null;
                        return;
                    }
                    const numeric = Number(value);
                    payload[field] = Number.isFinite(numeric) ? numeric : null;
                    return;
                }

                payload[field] =
                    value === null || value === undefined ? null : String(value);
            });

            return payload;
        });

        if (payloadRows.length === 0) {
            cancelEditing();
            return;
        }

        router.patch(
            saveUrl,
            { rows: payloadRows },
            {
                preserveScroll: true,
                preserveState: true,
                onStart: () => setIsSaving(true),
                onFinish: () => setIsSaving(false),
                onSuccess: () => {
                    setIsEditing(false);
                    draftsRef.current = {};
                    setDrafts({});
                },
            },
        );
    }, [saveUrl, booleanSet, numericSet, cancelEditing]);

    /** Wrap an onQueryChange handler so edits don't trigger page jumps. */
    const guardQueryChange = useCallback(
        <S,>(handler: (state: S) => void) => {
            return (state: S) => {
                if (isEditingRef.current) {
                    return;
                }
                handler(state);
            };
        },
        [],
    );

    return {
        isEditing,
        isSaving,
        drafts,
        startEditing,
        cancelEditing,
        saveEdits,
        handleCellChange,
        guardQueryChange,
        isEditingRef,
    };
}
