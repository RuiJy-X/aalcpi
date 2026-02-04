import {
    ArrowUpDown,
    BookOpen,
    Eye,
    FileCheck2,
    Pencil,
    Trash2,
    Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { SearchInput } from '@/components/ui/search-input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

type PlanterStatus = 'Active' | 'Inactive';

type OwnershipType = 'Owned' | 'Leased' | 'Tenant';

type PlanterRow = {
    id: string;
    name: string;
    address: string;
    status: PlanterStatus;
    email: string;
    phone: string;
    haciendaName: string;
    haciendaLocation: string;
    ownershipType: OwnershipType;
};

type SortKey = keyof Pick<
    PlanterRow,
    | 'id'
    | 'name'
    | 'address'
    | 'status'
    | 'email'
    | 'phone'
    | 'haciendaName'
    | 'haciendaLocation'
    | 'ownershipType'
>;

type SortState = {
    key: SortKey;
    direction: 'asc' | 'desc';
};

const seedRows: PlanterRow[] = [
    {
        id: 'PL-0001',
        name: 'Juan Dela Cruz',
        address: 'Brgy. San Roque, Talisay City',
        status: 'Active',
        email: 'juan.delacruz@example.com',
        phone: '+63 917 000 0001',
        haciendaName: 'Hacienda Esperanza',
        haciendaLocation: 'Talisay, Negros Occidental',
        ownershipType: 'Owned',
    },
    {
        id: 'PL-0002',
        name: 'Maria Santos',
        address: 'Brgy. Mabini, Bacolod City',
        status: 'Inactive',
        email: 'maria.santos@example.com',
        phone: '+63 917 000 0002',
        haciendaName: 'Hacienda Verde',
        haciendaLocation: 'Bacolod, Negros Occidental',
        ownershipType: 'Leased',
    },
    {
        id: 'PL-0003',
        name: 'Pedro Reyes',
        address: 'Brgy. 5, Silay City',
        status: 'Active',
        email: 'pedro.reyes@example.com',
        phone: '+63 917 000 0003',
        haciendaName: 'Hacienda Santa Clara',
        haciendaLocation: 'Silay, Negros Occidental',
        ownershipType: 'Tenant',
    },
];

function compareValues(a: string, b: string) {
    return a.localeCompare(b, undefined, {
        numeric: true,
        sensitivity: 'base',
    });
}

function SortableHeader({
    label,
    sortKey,
    sort,
    onSort,
    className,
}: {
    label: string;
    sortKey: SortKey;
    sort: SortState;
    onSort: (key: SortKey) => void;
    className?: string;
}) {
    const isActive = sort.key === sortKey;
    return (
        <Button
            type="button"
            variant="ghost"
            className={cn('h-8 px-2 text-xs font-semibold', className)}
            onClick={() => onSort(sortKey)}
        >
            <span>{label}</span>
            <ArrowUpDown
                className={cn(
                    'ml-1 h-3.5 w-3.5 opacity-40',
                    isActive && 'opacity-90',
                )}
            />
        </Button>
    );
}

export default function PlantersTabsTable() {
    const [tab, setTab] = useState<'planters' | 'records' | 'certifications'>(
        'planters',
    );

    const [rows, setRows] = useState<PlanterRow[]>(seedRows);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const [query, setQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<
        'all' | 'active' | 'inactive'
    >('all');
    const [ownershipFilter, setOwnershipFilter] = useState<
        'all' | OwnershipType
    >('all');

    const [sort, setSort] = useState<SortState>({
        key: 'name',
        direction: 'asc',
    });

    const filteredSortedRows = useMemo(() => {
        const q = query.trim().toLowerCase();

        const filtered = rows.filter((r) => {
            const matchesQuery =
                q.length === 0 ||
                [
                    r.id,
                    r.name,
                    r.address,
                    r.email,
                    r.phone,
                    r.haciendaName,
                    r.haciendaLocation,
                    r.ownershipType,
                    r.status,
                ]
                    .join(' ')
                    .toLowerCase()
                    .includes(q);

            const matchesStatus =
                statusFilter === 'all' ||
                (statusFilter === 'active' && r.status === 'Active') ||
                (statusFilter === 'inactive' && r.status === 'Inactive');

            const matchesOwnership =
                ownershipFilter === 'all' ||
                r.ownershipType === ownershipFilter;

            return matchesQuery && matchesStatus && matchesOwnership;
        });

        const sorted = [...filtered].sort((a, b) => {
            const aValue = String(a[sort.key] ?? '');
            const bValue = String(b[sort.key] ?? '');
            const cmp = compareValues(aValue, bValue);
            return sort.direction === 'asc' ? cmp : -cmp;
        });

        return sorted;
    }, [ownershipFilter, query, rows, sort.direction, sort.key, statusFilter]);

    const allVisibleSelected =
        filteredSortedRows.length > 0 &&
        filteredSortedRows.every((r) => selectedIds.has(r.id));

    const someVisibleSelected = filteredSortedRows.some((r) =>
        selectedIds.has(r.id),
    );

    const headerChecked: boolean | 'indeterminate' = allVisibleSelected
        ? true
        : someVisibleSelected
          ? 'indeterminate'
          : false;

    const toggleSort = (key: SortKey) => {
        setSort((prev) =>
            prev.key === key
                ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
                : { key, direction: 'asc' },
        );
    };

    const toggleRow = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleAllVisible = (checked: boolean) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);

            if (checked) {
                filteredSortedRows.forEach((r) => next.add(r.id));
            } else {
                filteredSortedRows.forEach((r) => next.delete(r.id));
            }

            return next;
        });
    };

    const selectedCount = selectedIds.size;

    const bulkDeleteDisabled = selectedCount === 0;

    const bulkDelete = () => {
        if (selectedIds.size === 0) return;

        setRows((prev) => prev.filter((r) => !selectedIds.has(r.id)));
        setSelectedIds(new Set());
    };

    return (
        <div className="m-3 h-full rounded-lg border bg-background p-4">
            <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-2">
                        <TabsList>
                            <TabsTrigger value="planters" className="gap-2">
                                <Users className="size-4" />
                                Planters
                            </TabsTrigger>
                            <TabsTrigger value="records" className="gap-2">
                                <BookOpen className="size-4" />
                                Records
                            </TabsTrigger>
                            <TabsTrigger
                                value="certifications"
                                className="gap-2"
                            >
                                <FileCheck2 className="size-4" />
                                Certifications
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <div className="w-full sm:w-72">
                            <SearchInput
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search"
                            />
                        </div>

                        <div className="flex w-full gap-2 sm:w-auto">
                            <div className="w-full sm:w-40">
                                <Select
                                    value={statusFilter}
                                    onValueChange={(v) =>
                                        setStatusFilter(
                                            v as typeof statusFilter,
                                        )
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        <SelectItem value="active">
                                            Active
                                        </SelectItem>
                                        <SelectItem value="inactive">
                                            Inactive
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="w-full sm:w-44">
                                <Select
                                    value={ownershipFilter}
                                    onValueChange={(v) =>
                                        setOwnershipFilter(
                                            v as typeof ownershipFilter,
                                        )
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Ownership" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        <SelectItem value="Owned">
                                            Owned
                                        </SelectItem>
                                        <SelectItem value="Leased">
                                            Leased
                                        </SelectItem>
                                        <SelectItem value="Tenant">
                                            Tenant
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button
                                variant="destructive"
                                disabled={bulkDeleteDisabled}
                                onClick={bulkDelete}
                            >
                                Delete{' '}
                                {selectedCount > 0 ? `(${selectedCount})` : ''}
                            </Button>
                        </div>
                    </div>
                </div>

                <TabsContent value="planters">
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-10">
                                        <Checkbox
                                            checked={headerChecked}
                                            onCheckedChange={(v) =>
                                                toggleAllVisible(v === true)
                                            }
                                            aria-label="Select all"
                                        />
                                    </TableHead>
                                    <TableHead>
                                        <SortableHeader
                                            label="Planter ID"
                                            sortKey="id"
                                            sort={sort}
                                            onSort={toggleSort}
                                        />
                                    </TableHead>
                                    <TableHead>
                                        <SortableHeader
                                            label="Name"
                                            sortKey="name"
                                            sort={sort}
                                            onSort={toggleSort}
                                        />
                                    </TableHead>
                                    <TableHead>
                                        <SortableHeader
                                            label="Address"
                                            sortKey="address"
                                            sort={sort}
                                            onSort={toggleSort}
                                        />
                                    </TableHead>
                                    <TableHead>
                                        <SortableHeader
                                            label="Status"
                                            sortKey="status"
                                            sort={sort}
                                            onSort={toggleSort}
                                        />
                                    </TableHead>
                                    <TableHead>
                                        <SortableHeader
                                            label="Email"
                                            sortKey="email"
                                            sort={sort}
                                            onSort={toggleSort}
                                        />
                                    </TableHead>
                                    <TableHead>
                                        <SortableHeader
                                            label="Phone"
                                            sortKey="phone"
                                            sort={sort}
                                            onSort={toggleSort}
                                        />
                                    </TableHead>
                                    <TableHead>
                                        <SortableHeader
                                            label="Hacienda Name"
                                            sortKey="haciendaName"
                                            sort={sort}
                                            onSort={toggleSort}
                                        />
                                    </TableHead>
                                    <TableHead>
                                        <SortableHeader
                                            label="Hacienda Location"
                                            sortKey="haciendaLocation"
                                            sort={sort}
                                            onSort={toggleSort}
                                        />
                                    </TableHead>
                                    <TableHead>
                                        <SortableHeader
                                            label="Ownership"
                                            sortKey="ownershipType"
                                            sort={sort}
                                            onSort={toggleSort}
                                        />
                                    </TableHead>
                                    <TableHead className="w-36 text-right">
                                        Actions
                                    </TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {filteredSortedRows.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={11}
                                            className="py-8 text-center text-muted-foreground"
                                        >
                                            No planters found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredSortedRows.map((r) => {
                                        const isSelected = selectedIds.has(
                                            r.id,
                                        );

                                        return (
                                            <TableRow
                                                key={r.id}
                                                data-state={
                                                    isSelected
                                                        ? 'selected'
                                                        : undefined
                                                }
                                                className={cn(
                                                    'cursor-pointer',
                                                    isSelected &&
                                                        'bg-muted/70 hover:bg-muted/70',
                                                )}
                                                onClick={() => toggleRow(r.id)}
                                            >
                                                <TableCell className="w-10">
                                                    <div
                                                        onClick={(e) =>
                                                            e.stopPropagation()
                                                        }
                                                    >
                                                        <Checkbox
                                                            checked={isSelected}
                                                            onCheckedChange={() =>
                                                                toggleRow(r.id)
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
                                                            r.status ===
                                                            'Active'
                                                                ? 'secondary'
                                                                : 'outline'
                                                        }
                                                        className={cn(
                                                            r.status ===
                                                                'Active'
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
                                                <TableCell>
                                                    {r.ownershipType}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div
                                                        className="flex justify-end gap-1"
                                                        onClick={(e) =>
                                                            e.stopPropagation()
                                                        }
                                                    >
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            aria-label="Preview"
                                                            onClick={() =>
                                                                console.log(
                                                                    'preview',
                                                                    r.id,
                                                                )
                                                            }
                                                        >
                                                            <Eye className="size-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            aria-label="Edit"
                                                            onClick={() =>
                                                                console.log(
                                                                    'edit',
                                                                    r.id,
                                                                )
                                                            }
                                                        >
                                                            <Pencil className="size-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            aria-label="Delete"
                                                            onClick={() => {
                                                                setRows(
                                                                    (prev) =>
                                                                        prev.filter(
                                                                            (
                                                                                p,
                                                                            ) =>
                                                                                p.id !==
                                                                                r.id,
                                                                        ),
                                                                );
                                                                setSelectedIds(
                                                                    (prev) => {
                                                                        const next =
                                                                            new Set(
                                                                                prev,
                                                                            );
                                                                        next.delete(
                                                                            r.id,
                                                                        );
                                                                        return next;
                                                                    },
                                                                );
                                                            }}
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
                </TabsContent>

                <TabsContent value="records">
                    <div className="flex items-center gap-2 rounded-md border p-6 text-muted-foreground">
                        <BookOpen className="size-4" />
                        Records table coming next.
                    </div>
                </TabsContent>

                <TabsContent value="certifications">
                    <div className="flex items-center gap-2 rounded-md border p-6 text-muted-foreground">
                        <FileCheck2 className="size-4" />
                        Certifications table coming next.
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
