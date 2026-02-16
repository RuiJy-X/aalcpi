import { Eye, Pencil, Trash2 } from 'lucide-react';
import type {
    PlanterRow,
    SortKey,
    SortState,
} from '@/components/planters/planters-table-types';
import { SortableHeader } from '@/components/planters/sortable-header';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

type Props = {
    rows: PlanterRow[];
    selectedIds: Set<string>;

    headerChecked: boolean | 'indeterminate';
    headers: string[];

    onToggleAllVisible: (checked: boolean) => void;
    onToggleRow: (id: string) => void;

    sort: SortState;
    onSort: (key: SortKey) => void;

    onPreviewRow: (id: string) => void;
    onEditRow: (id: string) => void;
    onDeleteRow: (id: string) => void;
};

export function PlantersTableView({
    rows,
    selectedIds,
    headerChecked,
    headers,
    onToggleAllVisible,
    onToggleRow,
    sort,
    onSort,
    onPreviewRow,
    onEditRow,
    onDeleteRow,
}: Props) {
    return (
        <div className="relative overflow-x-auto rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-10">
                            <Checkbox
                                className="mr-2"
                                checked={headerChecked}
                                onCheckedChange={(v) =>
                                    onToggleAllVisible(v === true)
                                }
                                aria-label="Select all"
                            />
                        </TableHead>
                        {headers.map((header) => (
                            <TableHead key={header}>
                                <SortableHeader
                                    label={header}
                                    sortKey={header.toLowerCase() as SortKey}
                                    sort={sort}
                                    onSort={onSort}
                                />
                            </TableHead>
                        ))}
                        <TableHead className="bg-transparenttext-right sticky right-0 z-20">
                            Actions
                        </TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {rows.length === 0 ? (
                        <TableRow>
                            <TableCell
                                colSpan={11}
                                className="py-8 text-center text-muted-foreground"
                            >
                                No planters found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        rows.map((r) => {
                            const isSelected = selectedIds.has(r.id);

                            return (
                                <TableRow
                                    key={r.id}
                                    data-state={
                                        isSelected ? 'selected' : undefined
                                    }
                                    className={cn(
                                        'cursor-pointer',
                                        isSelected &&
                                            'bg-muted/70 hover:bg-muted/70',
                                    )}
                                    onClick={() => onToggleRow(r.id)}
                                >
                                    <TableCell className="w-10">
                                        <div
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Checkbox
                                                checked={isSelected}
                                                onCheckedChange={() =>
                                                    onToggleRow(r.id)
                                                }
                                                aria-label={`Select ${r.id}`}
                                            />
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {r.id}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {r.planter_code}
                                    </TableCell>
                                    <TableCell className="min-w-[14rem]">
                                        {r.name}
                                    </TableCell>
                                    <TableCell className="truncate">
                                        {r.address}
                                    </TableCell>
                                    <TableCell className="truncate">
                                        {r.contact_number}
                                    </TableCell>
                                    <TableCell className="truncate">
                                        {r.tin_number}
                                    </TableCell>
                                    <TableCell className="truncate">
                                        {r.registration_date}
                                    </TableCell>
                                    <TableCell className="truncate">
                                        {r.created_at}
                                    </TableCell>
                                    <TableCell className="truncate">
                                        {r.updated_at}
                                    </TableCell>
                                    <TableCell>{'""lands""'}</TableCell>
                                    {/* <TableCell className="min-w-[14rem] truncate">
                                        {r.haciendaName}
                                    </TableCell>
                                    <TableCell className="min-w-[14rem] truncate">
                                        {r.haciendaLocation}
                                    </TableCell>
                                    <TableCell>{r.ownershipType}</TableCell> */}
                                    <TableCell className="sticky right-0 z-10 bg-transparent">
                                        <div
                                            className="flex justify-end gap-2"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Button
                                                variant="secondary"
                                                size="xs"
                                                aria-label="Preview"
                                                onClick={() =>
                                                    onPreviewRow(r.id)
                                                }
                                            >
                                                <Eye className="size-4" />
                                            </Button>
                                            <Button
                                                variant="blue"
                                                size="xs"
                                                aria-label="Edit"
                                                onClick={() => onEditRow(r.id)}
                                            >
                                                <Pencil className="size-4" />
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="xs"
                                                aria-label="Delete"
                                                onClick={() =>
                                                    onDeleteRow(r.id)
                                                }
                                            >
                                                <Trash2 className="size-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
