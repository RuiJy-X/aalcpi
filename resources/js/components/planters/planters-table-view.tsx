import { Eye, Pencil, Trash2 } from 'lucide-react';
import type {
    PlanterRow,
    SortKey,
    SortState,
} from '@/components/planters/planters-table-types';
import { SortableHeader } from '@/components/planters/sortable-header';
import { Badge } from '@/components/ui/badge';
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
    onToggleAllVisible,
    onToggleRow,
    sort,
    onSort,
    onPreviewRow,
    onEditRow,
    onDeleteRow,
}: Props) {
    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-10">
                            <Checkbox
                                checked={headerChecked}
                                onCheckedChange={(v) =>
                                    onToggleAllVisible(v === true)
                                }
                                aria-label="Select all"
                            />
                        </TableHead>
                        <TableHead>
                            <SortableHeader
                                label="Planter ID"
                                sortKey="id"
                                sort={sort}
                                onSort={onSort}
                            />
                        </TableHead>
                        <TableHead>
                            <SortableHeader
                                label="Name"
                                sortKey="name"
                                sort={sort}
                                onSort={onSort}
                            />
                        </TableHead>
                        <TableHead>
                            <SortableHeader
                                label="Address"
                                sortKey="address"
                                sort={sort}
                                onSort={onSort}
                            />
                        </TableHead>
                        <TableHead>
                            <SortableHeader
                                label="Status"
                                sortKey="status"
                                sort={sort}
                                onSort={onSort}
                            />
                        </TableHead>
                        <TableHead>
                            <SortableHeader
                                label="Email"
                                sortKey="email"
                                sort={sort}
                                onSort={onSort}
                            />
                        </TableHead>
                        <TableHead>
                            <SortableHeader
                                label="Phone"
                                sortKey="phone"
                                sort={sort}
                                onSort={onSort}
                            />
                        </TableHead>
                        <TableHead>
                            <SortableHeader
                                label="Hacienda Name"
                                sortKey="haciendaName"
                                sort={sort}
                                onSort={onSort}
                            />
                        </TableHead>
                        <TableHead>
                            <SortableHeader
                                label="Hacienda Location"
                                sortKey="haciendaLocation"
                                sort={sort}
                                onSort={onSort}
                            />
                        </TableHead>
                        <TableHead>
                            <SortableHeader
                                label="Ownership"
                                sortKey="ownershipType"
                                sort={sort}
                                onSort={onSort}
                            />
                        </TableHead>
                        <TableHead className="w-36 text-right">
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
                                    <TableCell>{r.name}</TableCell>
                                    <TableCell className="max-w-[16rem] truncate">
                                        {r.address}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={
                                                r.status === 'Active'
                                                    ? 'secondary'
                                                    : 'outline'
                                            }
                                            className={cn(
                                                r.status === 'Active'
                                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                                                    : 'text-muted-foreground',
                                            )}
                                        >
                                            {r.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="max-w-[14rem] truncate">
                                        {r.email}
                                    </TableCell>
                                    <TableCell>{r.phone}</TableCell>
                                    <TableCell className="max-w-[14rem] truncate">
                                        {r.haciendaName}
                                    </TableCell>
                                    <TableCell className="max-w-[14rem] truncate">
                                        {r.haciendaLocation}
                                    </TableCell>
                                    <TableCell>{r.ownershipType}</TableCell>
                                    <TableCell className="text-right">
                                        <div
                                            className="flex justify-end gap-1"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                aria-label="Preview"
                                                onClick={() =>
                                                    onPreviewRow(r.id)
                                                }
                                            >
                                                <Eye className="size-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                aria-label="Edit"
                                                onClick={() => onEditRow(r.id)}
                                            >
                                                <Pencil className="size-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
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
