import { Pencil, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function TableEditToolbar({
    isEditing,
    isSaving,
    disabled,
    onStart,
    onCancel,
    onSave,
}: {
    isEditing: boolean;
    isSaving?: boolean;
    disabled?: boolean;
    onStart: () => void;
    onCancel: () => void;
    onSave: () => void;
}) {
    if (!isEditing) {
        return (
            <Button
                type="button"
                variant="default"
                onClick={onStart}
                disabled={disabled}
            >
                <Pencil className="size-4" />
                Edit
            </Button>
        );
    }

    return (
        <>
            <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSaving}
            >
                <X className="size-4" />
                Cancel
            </Button>
            <Button type="button" onClick={onSave} disabled={isSaving}>
                <Save className="size-4" />
                {isSaving ? 'Saving...' : 'Save'}
            </Button>
        </>
    );
}
