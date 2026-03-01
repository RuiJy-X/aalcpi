import { Button } from '@/components/ui/button';
import { useState } from 'react';

type EditButtonProps = {
    isEditing?: boolean;
    defaultEditing?: boolean;
    onEditingChange?: (value: boolean) => void;
    editLabel?: string;
    doneLabel?: string;
    className?: string;
};

export default function EditButton({
    isEditing,
    defaultEditing = false,
    onEditingChange,
    editLabel = 'Edit',
    doneLabel = 'Done',
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
            variant={editing ? 'blue' : 'default'}
            onClick={handleClick}
            className={className}
        >
            {editing ? doneLabel : editLabel}
        </Button>
    );
}
