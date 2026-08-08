import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from '@/components/ui/combobox';
import { HandCoins, Calendar, Info } from 'lucide-react';

interface EmployeeOption {
    id: number;
    name: string;
    employee_code?: string;
    position?: string;
}

interface EmployeeOptionItem {
    id: string;
    label: string;
    code?: string;
    name: string;
    position: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    preselectedEmployeeId?: number;
    employeesList?: EmployeeOption[];
}

export function RecordAdvancementModal({
    isOpen,
    onClose,
    onSuccess,
    preselectedEmployeeId,
    employeesList = [],
}: Props) {
    const [employees, setEmployees] = useState<EmployeeOption[]>(employeesList);
    const [employeeId, setEmployeeId] = useState<string>(
        preselectedEmployeeId ? String(preselectedEmployeeId) : '',
    );
    const [amount, setAmount] = useState<string>('');
    const [advancementDate, setAdvancementDate] = useState<string>(() => {
        const d = new Date();
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    });
    const [notes, setNotes] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (preselectedEmployeeId) {
            setEmployeeId(String(preselectedEmployeeId));
        }
    }, [preselectedEmployeeId]);

    // Fetch employees if list is empty
    useEffect(() => {
        if (isOpen && employees.length === 0) {
            axios.get('/api/employees-list').then((res) => {
                if (res.data && res.data.employees) {
                    setEmployees(res.data.employees);
                }
            }).catch(() => {
                // fallback if endpoint not present
            });
        }
    }, [isOpen, employees.length]);

    const employeeOptions = useMemo<EmployeeOptionItem[]>(() => {
        return employees.map((emp) => ({
            id: String(emp.id),
            label: `${emp.employee_code ? `[${emp.employee_code}] ` : ''}${emp.name} (${emp.position || 'Encoder'})`,
            code: emp.employee_code,
            name: emp.name,
            position: emp.position || 'Encoder',
        }));
    }, [employees]);

    const selectedOption = useMemo(() => {
        return employeeOptions.find((opt) => opt.id === employeeId) ?? null;
    }, [employeeOptions, employeeId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!employeeId || !amount || !advancementDate) {
            alert('Please fill out all required fields.');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await axios.post('/advancements', {
                employee_id: parseInt(employeeId, 10),
                amount: parseFloat(amount),
                advancement_date: advancementDate,
                notes,
            });

            if (res.data.success) {
                alert(res.data.message || 'Cash Advancement granted successfully!');
                onClose();
                if (onSuccess) onSuccess();
                // Reset form
                setAmount('');
                setNotes('');
            }
        } catch (err: any) {
            alert(
                err.response?.data?.message ||
                    'Error recording cash advancement.',
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-base font-bold flex items-center gap-2">
                        <HandCoins className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        Grant Salary Cash Advancement
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-foreground space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-300">
                            <Info className="h-4 w-4 shrink-0" />
                            Rule: Date-Matched Payout & Next-Payroll Repayment
                        </div>
                        <p className="text-muted-foreground leading-relaxed">
                            This cash advance will be added to the payroll cutoff matching{' '}
                            <strong>Advancement Date</strong>. Repayment will automatically deduct from the employee's next payroll!
                        </p>
                    </div>

                    {!preselectedEmployeeId && (
                        <div className="space-y-1.5">
                            <Label htmlFor="adv_employee" className="text-xs font-semibold">
                                Select Employee *
                            </Label>
                            <Combobox
                                items={employeeOptions}
                                value={selectedOption}
                                onValueChange={(val: EmployeeOptionItem | null) => {
                                    setEmployeeId(val ? val.id : '');
                                }}
                            >
                                <ComboboxInput
                                    id="adv_employee"
                                    placeholder="Search employee by code, name, designation..."
                                    className="w-full"
                                />
                                <ComboboxContent className="max-h-60 overflow-y-auto">
                                    <ComboboxEmpty>No employee found.</ComboboxEmpty>
                                    <ComboboxList>
                                        {(item: EmployeeOptionItem) => (
                                            <ComboboxItem key={item.id} value={item}>
                                                <div className="flex flex-col text-xs py-0.5">
                                                    <span className="font-bold text-foreground">
                                                        {item.code ? `[${item.code}] ` : ''}
                                                        {item.name}
                                                    </span>
                                                    <span className="text-[11px] text-muted-foreground">
                                                        {item.position}
                                                    </span>
                                                </div>
                                            </ComboboxItem>
                                        )}
                                    </ComboboxList>
                                </ComboboxContent>
                            </Combobox>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="adv_amount" className="text-xs font-semibold">
                                Advance Amount (₱) *
                            </Label>
                            <Input
                                id="adv_amount"
                                type="number"
                                step="0.01"
                                min="1"
                                placeholder="e.g. 1500.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="adv_date" className="text-xs font-semibold">
                                Advancement Date *
                            </Label>
                            <Input
                                id="adv_date"
                                type="date"
                                value={advancementDate}
                                onChange={(e) => setAdvancementDate(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="adv_notes" className="text-xs font-semibold">
                            Notes / Reason (Optional)
                        </Label>
                        <Textarea
                            id="adv_notes"
                            placeholder="e.g. Emergency medical advance requested by employee..."
                            rows={2}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>

                    <DialogFooter className="pt-2">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            <HandCoins className="mr-2 h-4 w-4" />
                            {isSubmitting ? 'Recording...' : 'Grant Cash Advancement'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
