import { Head, router } from '@inertiajs/react';
import * as React from 'react';
import { CircleCheckBig } from 'lucide-react';

import AppLayout from '@/layouts/app-layout';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
import { Container, ContainerHeader } from '@/components/container';
import { index as quedansIndex } from '@/routes/quedans';
import { update_serial as quedansUpdateSerial } from '@/routes/quedans';
import type { BreadcrumbItem } from '@/types';
import type {
    ProductionRow,
    QuedanRow,
    QuedanStatus,
} from '@/components/planters/planters-table-types';

type Props = {
    pendingRegistration: ProductionRow[];
    vaultInventory: ProductionRow[];
};

type Drafts = Record<string, string>;

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Quedan Management',
        href: quedansIndex().url,
    },
];

const statusOptions: QuedanStatus[] = [
    'pending',
    'vaulted',
    'pledged',
    'released',
];

function normalizeStatus(row: ProductionRow): QuedanStatus {
    return row.quedan?.status ?? 'pending';
}

function normalizeSerial(row: ProductionRow): string {
    return row.quedan?.serial_number ?? '';
}

function statusBadgeVariant(
    status: QuedanStatus,
): 'default' | 'secondary' | 'outline' {
    if (status === 'vaulted') return 'secondary';
    if (status === 'pending') return 'outline';
    return 'default';
}

export default function QuedanManagement({
    pendingRegistration,
    vaultInventory,
}: Props) {
    const [pendingRows, setPendingRows] =
        React.useState<ProductionRow[]>(pendingRegistration);
    const [vaultRows, setVaultRows] =
        React.useState<ProductionRow[]>(vaultInventory);
    const [statusFilter, setStatusFilter] = React.useState<
        'all' | QuedanStatus
    >('all');
    const [drafts, setDrafts] = React.useState<Drafts>(() => {
        const initialDrafts: Drafts = {};
        pendingRegistration.forEach((row) => {
            initialDrafts[String(row.id)] = normalizeSerial(row);
        });
        return initialDrafts;
    });
    const [savingIds, setSavingIds] = React.useState<Record<string, boolean>>(
        {},
    );
    const [toastMessage, setToastMessage] = React.useState<string | null>(null);

    const inputRefs = React.useRef<Array<HTMLInputElement | null>>([]);
    const debounceTimers = React.useRef<Record<string, number>>({});

    const showToast = React.useCallback((message: string) => {
        setToastMessage(message);
        window.setTimeout(() => setToastMessage(null), 2200);
    }, []);

    const commitSerial = React.useCallback(
        (row: ProductionRow, serialOverride?: string) => {
            const rowId = String(row.id);
            const serialNumber = (serialOverride ?? drafts[rowId] ?? '').trim();

            if (!serialNumber || savingIds[rowId]) {
                return;
            }

            setSavingIds((current) => ({ ...current, [rowId]: true }));

            router.patch(
                quedansUpdateSerial(row.id).url,
                { serial_number: serialNumber },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        const nextQuedan: QuedanRow = {
                            id: row.quedan?.id ?? `temp-${row.id}`,
                            production_id: row.id,
                            serial_number: serialNumber,
                            status: 'vaulted',
                            remarks: row.quedan?.remarks ?? null,
                        };

                        const vaultedRow: ProductionRow = {
                            ...row,
                            quedan: nextQuedan,
                        };

                        setPendingRows((current) =>
                            current.filter(
                                (pendingRow) => pendingRow.id !== row.id,
                            ),
                        );

                        setVaultRows((current) => {
                            const withoutRow = current.filter(
                                (vaultRow) => vaultRow.id !== row.id,
                            );
                            return [vaultedRow, ...withoutRow];
                        });

                        setDrafts((current) => {
                            const next = { ...current };
                            delete next[rowId];
                            return next;
                        });

                        showToast(`Serial ${serialNumber} saved.`);
                    },
                    onFinish: () => {
                        setSavingIds((current) => ({
                            ...current,
                            [rowId]: false,
                        }));
                    },
                },
            );
        },
        [drafts, savingIds, showToast],
    );

    const scheduleDebouncedSave = React.useCallback(
        (row: ProductionRow, nextValue: string) => {
            const rowId = String(row.id);
            const existingTimer = debounceTimers.current[rowId];

            if (existingTimer) {
                window.clearTimeout(existingTimer);
            }

            debounceTimers.current[rowId] = window.setTimeout(() => {
                commitSerial(row, nextValue);
            }, 600);
        },
        [commitSerial],
    );

    const handleBlurSave = React.useCallback(
        (row: ProductionRow, nextValue?: string) => {
            const rowId = String(row.id);
            const existingTimer = debounceTimers.current[rowId];

            if (existingTimer) {
                window.clearTimeout(existingTimer);
            }

            commitSerial(row, nextValue);
        },
        [commitSerial],
    );

    const filteredVaultRows = React.useMemo(() => {
        if (statusFilter === 'all') {
            return vaultRows;
        }

        return vaultRows.filter((row) => normalizeStatus(row) === statusFilter);
    }, [statusFilter, vaultRows]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Quedan Management" />

            {toastMessage && (
                <div className="fixed top-4 right-4 z-50">
                    <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 shadow-sm">
                        <CircleCheckBig className="size-4 text-emerald-600" />
                        {toastMessage}
                    </div>
                </div>
            )}

            <Container>
                <ContainerHeader>Quedan Management</ContainerHeader>

                <Tabs defaultValue="pending">
                    <TabsList variant="line">
                        <TabsTrigger value="pending">
                            Pending Registration
                        </TabsTrigger>
                        <TabsTrigger value="vault">Vault Inventory</TabsTrigger>
                    </TabsList>

                    <TabsContent value="pending" className="mt-4">
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID</TableHead>
                                        <TableHead>Planter</TableHead>
                                        <TableHead>Hacienda</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Serial Number</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {pendingRows.length === 0 ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={5}
                                                className="text-center text-sm text-muted-foreground"
                                            >
                                                No pending rows.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        pendingRows.map((row, index) => {
                                            const rowId = String(row.id);
                                            const isSaving =
                                                savingIds[rowId] ?? false;

                                            return (
                                                <TableRow key={rowId}>
                                                    <TableCell>
                                                        {row.id}
                                                    </TableCell>
                                                    <TableCell>
                                                        {row.planter_name ??
                                                            row.planter_code ??
                                                            '-'}
                                                    </TableCell>
                                                    <TableCell>
                                                        {row.hacienda_name ??
                                                            row.hacienda_code ??
                                                            '-'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant={statusBadgeVariant(
                                                                normalizeStatus(
                                                                    row,
                                                                ),
                                                            )}
                                                        >
                                                            {normalizeStatus(
                                                                row,
                                                            )}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            ref={(element) => {
                                                                inputRefs.current[
                                                                    index
                                                                ] = element;
                                                            }}
                                                            value={
                                                                drafts[rowId] ??
                                                                ''
                                                            }
                                                            placeholder="Enter serial number"
                                                            onChange={(
                                                                event,
                                                            ) => {
                                                                const value =
                                                                    event.target
                                                                        .value;
                                                                setDrafts(
                                                                    (
                                                                        current,
                                                                    ) => ({
                                                                        ...current,
                                                                        [rowId]:
                                                                            value,
                                                                    }),
                                                                );
                                                                scheduleDebouncedSave(
                                                                    row,
                                                                    value,
                                                                );
                                                            }}
                                                            onBlur={(event) =>
                                                                handleBlurSave(
                                                                    row,
                                                                    event
                                                                        .currentTarget
                                                                        .value,
                                                                )
                                                            }
                                                            onKeyDown={(
                                                                event,
                                                            ) => {
                                                                if (
                                                                    event.key !==
                                                                    'Enter'
                                                                ) {
                                                                    return;
                                                                }

                                                                event.preventDefault();
                                                                handleBlurSave(
                                                                    row,
                                                                    event
                                                                        .currentTarget
                                                                        .value,
                                                                );

                                                                const nextInput =
                                                                    inputRefs
                                                                        .current[
                                                                        index +
                                                                            1
                                                                    ];
                                                                if (nextInput) {
                                                                    nextInput.focus();
                                                                }
                                                            }}
                                                            disabled={isSaving}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>

                    <TabsContent value="vault" className="mt-4">
                        <div className="mb-4 flex items-center gap-2">
                            <div className="text-sm font-medium">
                                Filter status
                            </div>
                            <Select
                                value={statusFilter}
                                onValueChange={(value: 'all' | QuedanStatus) =>
                                    setStatusFilter(value)
                                }
                            >
                                <SelectTrigger className="w-[220px]">
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        All statuses
                                    </SelectItem>
                                    {statusOptions.map((status) => (
                                        <SelectItem key={status} value={status}>
                                            {status}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID</TableHead>
                                        <TableHead>Planter</TableHead>
                                        <TableHead>Hacienda</TableHead>
                                        <TableHead>Serial Number</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Remarks</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredVaultRows.length === 0 ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={6}
                                                className="text-center text-sm text-muted-foreground"
                                            >
                                                No records in vault inventory.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredVaultRows.map((row) => {
                                            const status = normalizeStatus(row);

                                            return (
                                                <TableRow key={String(row.id)}>
                                                    <TableCell>
                                                        {row.id}
                                                    </TableCell>
                                                    <TableCell>
                                                        {row.planter_name ??
                                                            row.planter_code ??
                                                            '-'}
                                                    </TableCell>
                                                    <TableCell>
                                                        {row.hacienda_name ??
                                                            row.hacienda_code ??
                                                            '-'}
                                                    </TableCell>
                                                    <TableCell>
                                                        {row.quedan
                                                            ?.serial_number ??
                                                            '-'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant={statusBadgeVariant(
                                                                status,
                                                            )}
                                                        >
                                                            {status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {row.quedan?.remarks ??
                                                            '-'}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>
                </Tabs>
            </Container>
        </AppLayout>
    );
}
