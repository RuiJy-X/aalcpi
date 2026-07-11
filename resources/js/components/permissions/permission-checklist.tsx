import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

export type PermissionItem = {
    name: string;
    action: string;
    label: string;
};

type Props = {
    permissionGroups: Record<string, PermissionItem[]>;
    resourceLabels: Record<string, string>;
    selected: string[];
    onChange: (permissions: string[]) => void;
    disabled?: boolean;
    /** Max height of the scroll area (CSS value). Default: 20rem */
    maxHeight?: string;
};

export function PermissionChecklist({
    permissionGroups,
    resourceLabels,
    selected,
    onChange,
    disabled = false,
    maxHeight = '20rem',
}: Props) {
    const [openResource, setOpenResource] = useState<string | null>(null);

    const toggle = (name: string, checked: boolean) => {
        if (checked) {
            onChange([...new Set([...selected, name])]);
        } else {
            onChange(selected.filter((p) => p !== name));
        }
    };

    const toggleResource = (resource: string, checked: boolean) => {
        const names = (permissionGroups[resource] ?? []).map((p) => p.name);
        if (checked) {
            onChange([...new Set([...selected, ...names])]);
        } else {
            onChange(selected.filter((p) => !names.includes(p)));
        }
    };

    return (
        <div
            className="overflow-y-auto rounded-md border border-border"
            style={{ maxHeight }}
        >
            <ul className="divide-y divide-border">
                {Object.entries(permissionGroups).map(([resource, items]) => {
                    const allSelected = items.every((i) =>
                        selected.includes(i.name),
                    );
                    const someSelected =
                        !allSelected &&
                        items.some((i) => selected.includes(i.name));
                    const selectedCount = items.filter((i) =>
                        selected.includes(i.name),
                    ).length;
                    const isOpen = openResource === resource;

                    return (
                        <li key={resource}>
                            <Collapsible
                                open={isOpen}
                                onOpenChange={(open) =>
                                    setOpenResource(open ? resource : null)
                                }
                            >
                                <div className="flex items-center gap-2 px-3 py-2.5 hover:bg-muted/50">
                                    <Checkbox
                                        id={`resource-${resource}`}
                                        checked={
                                            allSelected
                                                ? true
                                                : someSelected
                                                  ? 'indeterminate'
                                                  : false
                                        }
                                        disabled={disabled}
                                        onCheckedChange={(value) =>
                                            toggleResource(resource, !!value)
                                        }
                                        onClick={(e) => e.stopPropagation()}
                                    />

                                    <CollapsibleTrigger asChild>
                                        <button
                                            type="button"
                                            className="flex min-w-0 flex-1 items-center justify-between gap-2 text-left"
                                            disabled={disabled}
                                        >
                                            <span className="truncate font-medium">
                                                {resourceLabels[resource] ??
                                                    resource}
                                            </span>
                                            <span className="flex shrink-0 items-center gap-2">
                                                <span className="text-xs text-muted-foreground">
                                                    {selectedCount}/{items.length}
                                                </span>
                                                <ChevronDown
                                                    className={cn(
                                                        'h-4 w-4 text-muted-foreground transition-transform duration-200',
                                                        isOpen && 'rotate-180',
                                                    )}
                                                />
                                            </span>
                                        </button>
                                    </CollapsibleTrigger>
                                </div>

                                <CollapsibleContent>
                                    <ul className="space-y-2 border-t border-border bg-muted/30 px-3 py-2.5 pl-10">
                                        {items.map((item) => (
                                            <li
                                                key={item.name}
                                                className="flex items-center gap-2"
                                            >
                                                <Checkbox
                                                    id={item.name}
                                                    checked={selected.includes(
                                                        item.name,
                                                    )}
                                                    disabled={disabled}
                                                    onCheckedChange={(value) =>
                                                        toggle(
                                                            item.name,
                                                            !!value,
                                                        )
                                                    }
                                                />
                                                <Label
                                                    htmlFor={item.name}
                                                    className="cursor-pointer text-sm font-normal"
                                                >
                                                    {item.label}
                                                </Label>
                                            </li>
                                        ))}
                                    </ul>
                                </CollapsibleContent>
                            </Collapsible>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
