import { BookOpen, FileCheck2, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { PlantersTableToolbar } from '@/components/planters/planters-table-toolbar';
import type {
    OwnershipType,
    PlantersTabKey,
    PlanterRow,
    SortKey,
    SortState,
} from '@/components/planters/planters-table-types';
import { PlantersTableView } from '@/components/planters/planters-table-view';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

function compareValues(a: string, b: string) {
    return a.localeCompare(b, undefined, {
        numeric: true,
        sensitivity: 'base',
    });
}

export default function PlantersTabsTable() {
    const [tab, setTab] = useState<PlantersTabKey>('planters');

    const [rows, setRows] = useState<PlanterRow[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        const controller = new AbortController();

        (async () => {
            try {
                const res = await fetch('/Planters/data', {
                    headers: { Accept: 'application/json' },
                    signal: controller.signal,
                });

                if (!res.ok) {
                    throw new Error(
                        `Failed to fetch planters: ${res.status} ${res.statusText}`,
                    );
                }

                const data = (await res.json()) as PlanterRow[];
                setRows(Array.isArray(data) ? data : []);
            } catch (err) {
                if (err instanceof DOMException && err.name === 'AbortError') {
                    return;
                }
                console.error(err);
            }
        })();

        return () => controller.abort();
    }, []);

    // Get field names (object keys) from the first row.
    // This is derived state, so compute it with useMemo (no side effects).
    const headers = useMemo(() => {
        return Object.keys(rows[0] ?? {});
    }, [rows]);

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
                    r.tin_number,
                    r.contact_number,
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

    const bulkDelete = () => {
        if (selectedIds.size === 0) return;

        setRows((prev) => prev.filter((r) => !selectedIds.has(r.id)));
        setSelectedIds(new Set());
    };

    const deleteRow = (id: string) => {
        setRows((prev) => prev.filter((p) => p.id !== id));
        setSelectedIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });
    };

    return (
        <div className="m-3 h-full rounded-lg border bg-[color:var(--card)] p-4">
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

                    <PlantersTableToolbar
                        query={query}
                        onQueryChange={setQuery}
                        statusFilter={statusFilter}
                        onStatusFilterChange={setStatusFilter}
                        ownershipFilter={ownershipFilter}
                        onOwnershipFilterChange={setOwnershipFilter}
                        selectedCount={selectedCount}
                        onBulkDelete={bulkDelete}
                    />
                </div>

                <TabsContent value="planters">
                    <PlantersTableView
                        rows={filteredSortedRows}
                        selectedIds={selectedIds}
                        headers={headers}
                        headerChecked={headerChecked}
                        onToggleAllVisible={toggleAllVisible}
                        onToggleRow={toggleRow}
                        sort={sort}
                        onSort={toggleSort}
                        onPreviewRow={(id) => console.log('preview', id)}
                        onEditRow={(id) => console.log('edit', id)}
                        onDeleteRow={deleteRow}
                    />
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
