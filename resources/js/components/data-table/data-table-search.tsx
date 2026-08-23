import React from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface DataTableSearchProps
    extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
    value?: string;
    defaultValue?: string;
    onChange?: (value: string) => void;
    debounceMs?: number;
    placeholder?: string;
    wrapperClassName?: string;
    inputClassName?: string;
}

export function DataTableSearch({
    value: controlledValue,
    defaultValue = '',
    onChange,
    debounceMs = 300,
    placeholder = 'Search all columns...',
    className,
    wrapperClassName,
    inputClassName,
    ...props
}: DataTableSearchProps) {
    const initialValue = controlledValue ?? defaultValue;
    const [localValue, setLocalValue] = React.useState<string>(initialValue);
    const initialMountRef = React.useRef(true);
    const lastSentValueRef = React.useRef<string>(initialValue);

    // Sync external prop changes into local state without emitting onChange
    React.useEffect(() => {
        if (controlledValue !== undefined && controlledValue !== localValue) {
            setLocalValue(controlledValue);
            lastSentValueRef.current = controlledValue;
        }
    }, [controlledValue]);

    // Only fire onChange after debounce when localValue changed via user input
    React.useEffect(() => {
        if (initialMountRef.current) {
            initialMountRef.current = false;
            return;
        }

        if (localValue === lastSentValueRef.current) {
            return;
        }

        const timer = setTimeout(() => {
            lastSentValueRef.current = localValue;
            onChange?.(localValue);
        }, debounceMs);

        return () => clearTimeout(timer);
    }, [localValue, onChange, debounceMs]);

    const handleClear = () => {
        setLocalValue('');
        if (lastSentValueRef.current !== '') {
            lastSentValueRef.current = '';
            onChange?.('');
        }
    };

    return (
        <div className={cn('relative w-full max-w-sm', wrapperClassName, className)}>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
                type="text"
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                placeholder={placeholder}
                className={cn('h-9 pl-9 pr-8 text-xs sm:text-sm bg-white shadow-xs', inputClassName)}
                {...props}
            />
            {localValue && (
                <button
                    type="button"
                    onClick={handleClear}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                    title="Clear search"
                >
                    <X className="h-3.5 w-3.5" />
                    <span className="sr-only">Clear search</span>
                </button>
            )}
        </div>
    );
}
