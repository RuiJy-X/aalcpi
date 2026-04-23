'use client';

import { router } from '@inertiajs/react';
import type { ColumnDef } from '@tanstack/react-table';
import { Check, Printer, X } from 'lucide-react';
import type { ProductionRow } from '@/components/planters/planters-table-types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    accept,
    cancel_acceptance,
    reject,
    voucher,
} from '@/routes/distributions';

const statusLabelMap: Record<string, string> = {
    pending_price: 'Pending Price',
    calculated_pending_review: 'Calculated / Pending Review',
    accepted: 'Accepted',
};

function formatMoney(value: number | string | null | undefined): string {
    if (value === null || value === undefined || value === '') {
        return '-';
    }

    const numericValue = Number(value);
    if (Number.isNaN(numericValue)) {
        return '-';
    }

    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(numericValue);
}

function statusVariant(status: string | null | undefined) {
    if (status === 'accepted') {
        return 'default';
    }

    if (status === 'calculated_pending_review') {
        return 'secondary';
    }

    return 'outline';
}

export const distributionColumns: ColumnDef<ProductionRow>[] = [
    {
        accessorKey: 'trans_code',
        header: 'Trans Code',
    },
    {
        accessorKey: 'planter_name',
        header: 'Planter',
    },
    {
        accessorKey: 'crop_year',
        header: 'Crop Year',
    },
    {
        accessorKey: 'week_no',
        header: 'Week',
    },
    {
        accessorKey: 'financial_status',
        header: 'Financial Status',
        cell: ({ row }) => {
            const status = row.original.financial_status ?? 'pending_price';

            return (
                <Badge variant={statusVariant(status)}>
                    {statusLabelMap[status] ?? status}
                </Badge>
            );
        },
    },
    {
        accessorKey: 'distribution_total',
        header: 'Sugar Total',
        cell: ({ row }) => formatMoney(row.original.distribution_total),
    },
    {
        accessorKey: 'molasses_total',
        header: 'Molasses Total',
        cell: ({ row }) => formatMoney(row.original.molasses_total),
    },
    {
        accessorKey: 'planter_lkg_money',
        header: 'Planter LKG Money',
        cell: ({ row }) => formatMoney(row.original.planter_lkg_money),
    },
    {
        accessorKey: 'pdpa_lkg_money',
        header: 'PDPA LKG Money',
        cell: ({ row }) => formatMoney(row.original.pdpa_lkg_money),
    },
    {
        accessorKey: 'association_dues_lkg_money',
        header: 'Assoc Dues LKG Money',
        cell: ({ row }) => formatMoney(row.original.association_dues_lkg_money),
    },
    {
        accessorKey: 'planter_mol_money',
        header: 'Planter MOL Money',
        cell: ({ row }) => formatMoney(row.original.planter_mol_money),
    },
    {
        accessorKey: 'pdpa_mol_money',
        header: 'PDPA MOL Money',
        cell: ({ row }) => formatMoney(row.original.pdpa_mol_money),
    },
    {
        accessorKey: 'association_dues_mol_money',
        header: 'Assoc Dues MOL Money',
        cell: ({ row }) => formatMoney(row.original.association_dues_mol_money),
    },
    {
        id: 'actions',
        enableSorting: false,
        header: 'Actions',
        cell: ({ row }) => {
            const production = row.original;
            const status = production.financial_status;
            const canReview = status === 'calculated_pending_review';
            const isAccepted = status === 'accepted';

            return (
                <div
                    className="flex items-center gap-2"
                    data-no-row-open="true"
                >
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={!canReview}
                        onClick={() => {
                            router.patch(
                                accept(production.id).url,
                                {},
                                { preserveScroll: true },
                            );
                        }}
                    >
                        <Check className="h-4 w-4" />
                        Accept
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        disabled={!canReview && !isAccepted}
                        onClick={() => {
                            const promptMessage = isAccepted
                                ? 'Please provide cancellation reason:'
                                : 'Please provide rejection reason:';

                            const reason = window.prompt(promptMessage);

                            if (!reason || reason.trim().length < 5) {
                                window.alert(
                                    'Reason is required and must be at least 5 characters.',
                                );
                                return;
                            }

                            if (isAccepted) {
                                router.patch(
                                    cancel_acceptance(production.id).url,
                                    { reason: reason.trim() },
                                    { preserveScroll: true },
                                );
                                return;
                            }

                            router.patch(
                                reject(production.id).url,
                                { reason: reason.trim() },
                                { preserveScroll: true },
                            );
                        }}
                    >
                        <X className="h-4 w-4" />
                        {isAccepted ? 'Cancel Acceptance' : 'Reject'}
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        disabled={!isAccepted}
                        onClick={() =>
                            window.open(voucher(production.id).url, '_blank')
                        }
                    >
                        <Printer className="h-4 w-4" />
                        Print Voucher
                    </Button>
                </div>
            );
        },
    },
];
