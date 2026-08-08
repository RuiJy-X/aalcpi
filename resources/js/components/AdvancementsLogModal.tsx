import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { History, Search, Trash2, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

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

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

const statusBadges: Record<string, { label: string; class: string }> = {
    pending_payout: {
        label: 'Pending Payout',
        class: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300',
    },
    paid_out: {
        label: 'Paid Out (Queued Repayment)',
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

export function AdvancementsLogModal({ isOpen, onClose }: Props) {
    const [advancements, setAdvancements] = useState<AdvancementItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchLogs = () => {
        setIsLoading(true);
        axios
            .get('/advancements')
            .then((res) => {
                if (res.data && res.data.advancements) {
                    setAdvancements(res.data.advancements);
                }
            })
            .catch(() => {})
            .finally(() => setIsLoading(false));
    };

    useEffect(() => {
        if (isOpen) {
            fetchLogs();
        }
    }, [isOpen]);

    const handleCancelAdvancement = async (id: number) => {
        if (!confirm('Are you sure you want to cancel this pending advancement request?')) {
            return;
        }

        try {
            const res = await axios.delete(`/advancements/${id}`);
            if (res.data.success) {
                alert(res.data.message || 'Advancement cancelled.');
                fetchLogs();
            }
        } catch (err: any) {
            alert(err.response?.data?.message || 'Error cancelling advancement.');
        }
    };

    const filteredAdvancements = advancements.filter(
        (item) =>
            item.employee_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.employee_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase())),
    );

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="text-base font-bold flex items-center gap-2">
                        <History className="h-5 w-5 text-primary" />
                        Salary Advancements History Audit Register
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-3 flex-1 overflow-hidden flex flex-col pt-2">
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by Employee Name, Code, or Notes..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 h-9 text-xs"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar border border-border rounded-lg">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-muted/50 font-semibold text-muted-foreground uppercase border-b border-border tracking-wider sticky top-0 bg-card">
                                <tr>
                                    <th className="p-2.5">Date</th>
                                    <th className="p-2.5">Code</th>
                                    <th className="p-2.5">Employee</th>
                                    <th className="p-2.5 text-right">Original Advance</th>
                                    <th className="p-2.5 text-right">Remaining Unpaid</th>
                                    <th className="p-2.5 text-center">Status</th>
                                    <th className="p-2.5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={7} className="p-6 text-center text-muted-foreground">
                                            Loading advancement history...
                                        </td>
                                    </tr>
                                ) : filteredAdvancements.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-6 text-center text-muted-foreground">
                                            No cash advancement records found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredAdvancements.map((adv) => {
                                        const badge = statusBadges[adv.status] || {
                                            label: adv.status,
                                            class: '',
                                        };
                                        return (
                                            <tr key={adv.id} className="hover:bg-muted/30">
                                                <td className="p-2.5 font-medium whitespace-nowrap">
                                                    {adv.advancement_date}
                                                </td>
                                                <td className="p-2.5 font-mono font-bold text-primary whitespace-nowrap">
                                                    {adv.employee_code}
                                                </td>
                                                <td className="p-2.5">
                                                    <div className="font-bold text-foreground">
                                                        {adv.employee_name}
                                                    </div>
                                                    {adv.notes && (
                                                        <div className="text-[10px] text-muted-foreground truncate max-w-[200px]">
                                                            {adv.notes}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                                                    ₱{adv.amount.toFixed(2)}
                                                </td>
                                                <td className="p-2.5 text-right font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                                                    ₱{adv.remaining_balance.toFixed(2)}
                                                </td>
                                                <td className="p-2.5 text-center whitespace-nowrap">
                                                    <Badge
                                                        variant="outline"
                                                        className={`text-[10px] uppercase font-bold tracking-wider ${badge.class}`}
                                                    >
                                                        {badge.label}
                                                    </Badge>
                                                </td>
                                                <td className="p-2.5 text-right whitespace-nowrap">
                                                    {adv.status === 'pending_payout' && (
                                                        <Button
                                                            size="xs"
                                                            variant="ghost"
                                                            onClick={() => handleCancelAdvancement(adv.id)}
                                                            className="text-rose-600 hover:text-rose-700 h-7 px-2"
                                                        >
                                                            <Trash2 className="h-3 w-3 mr-1" />
                                                            Cancel
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <DialogFooter className="pt-2">
                    <Button variant="outline" onClick={onClose}>
                        Close Register
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
