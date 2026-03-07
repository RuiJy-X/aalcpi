import { useState } from 'react';
import { Button } from '@/components/ui/button';

type EditButtonProps = {
    isEditing?: boolean;
    defaultEditing?: boolean;
    onEditingChange?: (value: boolean) => void;
    editLabel?: string;
    cancelLabel?: string;
    className?: string;
};

export default function EditButton({
    isEditing,
    defaultEditing = false,
    onEditingChange,
    editLabel = 'Edit',
    cancelLabel = 'Cancel',
    className = 'max-w-3xs',
}: EditButtonProps) {
    const [internalEditing, setInternalEditing] = useState(defaultEditing);
    const editing = isEditing ?? internalEditing;

    const handleClick = () => {
        const nextValue = !editing;

        if (isEditing === undefined) {
            setInternalEditing(nextValue);
        }

        onEditingChange?.(nextValue);
    };

    return (
        <Button
            variant={editing ? 'outline' : 'default'}
            onClick={handleClick}
            className={className}
        >
            {editing ? cancelLabel : editLabel}
        </Button>
    );
}
