import React, { useMemo, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import axios from 'axios';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import {
    Container,
    ContainerHeader,
    ContainerHeaderEnd,
} from '@/components/container';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '@/components/data-table/data-table';
import type { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';
import {
    HandCoins,
    Plus,
    Search,
    Clock,
    CheckCircle2,
    RotateCcw,
    Trash2,
    ExternalLink,
    Wallet,
} from 'lucide-react';
import { RecordAdvancementModal } from '@/Components/RecordAdvancementModal';
import { show as employeeShow } from '@/routes/employees';

interface EmployeeOption {
    id: number;
    name: string;
    employee_code?: string;
    position?: string;
}

interface AdvancementItem {
    id: number;
    employee_id: number;
    employee_name: string;
    employee_code: string;
    position: string;
    amount: number;
    remaining_balance: number;
    advancement_date: string;
    status: 'pending_payout' | 'paid_out' | 'partially_deducted' | 'deducted' | 'cancelled';
    notes?: string;
}

interface Totals {
    total_granted: number;
    pending_payout: number;
    outstanding_repayment: number;
    fully_repaid: number;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Payroll Management',
        href: '/Payroll',
    },
    {
        title: 'Salary Advancements',
        href: '/advancements-page',
    },
];

const statusBadges: Record<string, { label: string; class: string }> = {
    pending_payout: {
        label: 'Pending Payout',
        class: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300',
    },
    paid_out: {
        label: 'Paid Out (Repaying)',
        class: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300',
    },
    partially_deducted: {
        label: 'Partially Deducted',
        class: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/60 dark:text-orange-300',
    },
    deducted: {
        label: 'Fully Repaid',
        class: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300',
    },
    cancelled: {
        label: 'Cancelled',
        class: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-900 dark:text-slate-400',
    },
};

function SortHeader({
    label,
    column,
}: {
    label: string;
    column: {
        toggleSorting: (desc?: boolean) => void;
        getIsSorted: () => false | 'asc' | 'desc';
    };
}) {
    return (
        <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 data-[state=open]:bg-accent text-xs font-semibold"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
            <span>{label}</span>
            <ArrowUpDown className="ml-1.5 h-3 w-3" />
        </Button>
    );
}

export default function AdvancementsIndexPage({
    advancements,
    totals,
    employees,
}: {
    advancements: AdvancementItem[];
    totals: Totals;
    employees: EmployeeOption[];
}) {
    const [activeTab, setActiveTab] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [isGrantModalOpen, setIsGrantModalOpen] = useState(false);

    // Dynamic Filter
    const filteredAdvancements = useMemo(() => {
        return advancements.filter((item) => {
            // Status Tab filter
            if (activeTab === 'pending' && item.status !== 'pending_payout') return false;
            if (activeTab === 'repaying' && !['paid_out', 'partially_deducted'].includes(item.status)) return false;
            if (activeTab === 'repaid' && item.status !== 'deducted') return false;
            if (activeTab === 'cancelled' && item.status !== 'cancelled') return false;

            // Search query filter
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchName = item.employee_name.toLowerCase().includes(q);
                const matchCode = item.employee_code.toLowerCase().includes(q);
                const matchNotes = item.notes ? item.notes.toLowerCase().includes(q) : false;
                return matchName || matchCode || matchNotes;
            }

            return true;
        });
    }, [advancements, activeTab, searchQuery]);

    const handleCancelAdvancement = async (id: number) => {
        if (!confirm('Are you sure you want to cancel this pending cash advance?')) {
            return;
        }

        try {
            await axios.delete(`/advancements/${id}`);
            router.reload();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Error cancelling advancement.');
        }
    };

    const advancementColumns = useMemo<ColumnDef<AdvancementItem>[]>(
        () => [
            {
                accessorKey: 'advancement_date',
                header: ({ column }) => <SortHeader label="Advancement Date" column={column} />,
                cell: ({ row }) => <div className="font-medium whitespace-nowrap text-xs">{row.original.advancement_date}</div>,
            },
            {
                accessorKey: 'employee_code',
                header: ({ column }) => <SortHeader label="Code" column={column} />,
                cell: ({ row }) => <div className="font-mono font-bold text-primary whitespace-nowrap text-xs">{row.original.employee_code}</div>,
            },
            {
                accessorKey: 'employee_name',
                header: ({ column }) => <SortHeader label="Employee Name" column={column} />,
                cell: ({ row }) => (
                    <div>
                        <div className="font-bold text-foreground text-xs">{row.original.employee_name}</div>
                        {row.original.notes && (
                            <div className="text-[10px] text-muted-foreground truncate max-w-[220px]">{row.original.notes}</div>
                        )}
                    </div>
                ),
            },
            {
                accessorKey: 'position',
                header: ({ column }) => <SortHeader label="Designation" column={column} />,
                cell: ({ row }) => <div className="text-muted-foreground whitespace-nowrap text-xs">{row.original.position}</div>,
            },
            {
                accessorKey: 'amount',
                header: ({ column }) => (
                    <div className="text-right">
                        <SortHeader label="Granted Advance" column={column} />
                    </div>
                ),
                cell: ({ row }) => (
                    <div className="text-right font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap text-xs">
                        ₱{row.original.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </div>
                ),
            },
            {
                accessorKey: 'remaining_balance',
                header: ({ column }) => (
                    <div className="text-right">
                        <SortHeader label="Unpaid Balance" column={column} />
                    </div>
                ),
                cell: ({ row }) => (
                    <div className="text-right font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap text-xs">
                        ₱{row.original.remaining_balance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </div>
                ),
            },
            {
                accessorKey: 'status',
                header: ({ column }) => (
                    <div className="text-center">
                        <SortHeader label="Status" column={column} />
                    </div>
                ),
                cell: ({ row }) => {
                    const badge = statusBadges[row.original.status] || { label: row.original.status, class: '' };
                    return (
                        <div className="text-center whitespace-nowrap">
                            <Badge variant="outline" className={`text-[10px] uppercase font-bold tracking-wider ${badge.class}`}>
                                {badge.label}
                            </Badge>
                        </div>
                    );
                },
            },
            {
                id: 'actions',
                header: () => <div className="text-right text-xs">Actions</div>,
                cell: ({ row }) => (
                    <div className="flex items-center justify-end gap-1 whitespace-nowrap">
                        <Button size="xs" variant="outline" asChild className="h-7 text-xs">
                            <Link href={employeeShow(row.original.employee_id).url}>
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Profile
                            </Link>
                        </Button>

                        {row.original.status === 'pending_payout' && (
                            <Button
                                size="xs"
                                variant="ghost"
                                onClick={() => handleCancelAdvancement(row.original.id)}
                                className="h-7 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Cancel
                            </Button>
                        )}
                    </div>
                ),
            },
        ],
        [],
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Salary Cash Advancements Management" />

            <Container>
                <ContainerHeader>
                    <div>
                        <div className="flex items-center gap-2">
                            <HandCoins className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                            <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                Salary Cash Advancements
                            </h1>
                        </div>
                        <p className="text-sm font-normal text-muted-foreground mt-0.5">
                            Manage employee cash advance payouts, date-matched cutoffs, repayment tracking, and audit transaction logs.
                        </p>
                    </div>
                    <ContainerHeaderEnd>
                        <Button
                            onClick={() => setIsGrantModalOpen(true)}
                            className="font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-4"
                        >
                            <Plus className="mr-1.5 h-4 w-4" />
                            Grant Cash Advance
                        </Button>
                    </ContainerHeaderEnd>
                </ContainerHeader>

                <div className="space-y-6 pt-2">
                    {/* Executive Stat Banner */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-xl border border-border bg-card p-4 shadow-xs">
                            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                <span>Total Granted</span>
                                <Wallet className="h-4 w-4 text-primary" />
                            </div>
                            <div className="mt-2 text-2xl font-extrabold text-foreground">
                                ₱{totals.total_granted.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-1">
                                Lifetime sum of granted advances
                            </p>
                        </div>

                        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 shadow-xs">
                            <div className="flex items-center justify-between text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                                <span>Pending Payout</span>
                                <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div className="mt-2 text-2xl font-extrabold text-amber-800 dark:text-amber-200">
                                ₱{totals.pending_payout.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                            </div>
                            <p className="text-[11px] text-amber-700/80 dark:text-amber-300/80 mt-1">
                                Queued for upcoming payroll payout
                            </p>
                        </div>

                        <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 shadow-xs">
                            <div className="flex items-center justify-between text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                                <span>Outstanding Repayment</span>
                                <RotateCcw className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="mt-2 text-2xl font-extrabold text-blue-800 dark:text-blue-200">
                                ₱{totals.outstanding_repayment.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                            </div>
                            <p className="text-[11px] text-blue-700/80 dark:text-blue-300/80 mt-1">
                                Currently being deducted from payrolls
                            </p>
                        </div>

                        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 shadow-xs">
                            <div className="flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                                <span>Fully Repaid</span>
                                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div className="mt-2 text-2xl font-extrabold text-emerald-800 dark:text-emerald-200">
                                ₱{totals.fully_repaid.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                            </div>
                            <p className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80 mt-1">
                                100% recovered from employee pay
                            </p>
                        </div>
                    </div>

                    {/* Navigation Tabs & Search Toolbar */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-3">
                        <Tabs
                            value={activeTab}
                            onValueChange={setActiveTab}
                            className="w-full sm:w-auto"
                        >
                            <TabsList variant="line" className="h-10">
                                <TabsTrigger value="all" className="gap-2 text-xs sm:text-sm font-semibold">
                                    All ({advancements.length})
                                </TabsTrigger>
                                <TabsTrigger value="pending" className="gap-2 text-xs sm:text-sm font-semibold">
                                    Pending Payout
                                </TabsTrigger>
                                <TabsTrigger value="repaying" className="gap-2 text-xs sm:text-sm font-semibold">
                                    Repaying
                                </TabsTrigger>
                                <TabsTrigger value="repaid" className="gap-2 text-xs sm:text-sm font-semibold">
                                    Fully Repaid
                                </TabsTrigger>
                                <TabsTrigger value="cancelled" className="gap-2 text-xs sm:text-sm font-semibold">
                                    Cancelled
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>

                        <div className="relative w-full sm:w-[280px]">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by Employee Name or Code..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 h-9 text-xs"
                            />
                        </div>
                    </div>

                    {/* Advancements Master DataTable */}
                    <div className="rounded-xl border border-border bg-card shadow-xs p-1">
                        <DataTable
                            data={filteredAdvancements}
                            columns={advancementColumns}
                        />
                    </div>
                </div>
            </Container>

            {/* Grant Cash Advancement Modal */}
            <RecordAdvancementModal
                isOpen={isGrantModalOpen}
                onClose={() => setIsGrantModalOpen(false)}
                onSuccess={() => router.reload()}
                employeesList={employees}
            />
        </AppLayout>
    );
}
