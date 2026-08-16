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
    const [repaymentTermType, setRepaymentTermType] = useState<'full' | 'months' | 'payrolls' | 'fixed_amount'>('full');
    const [repaymentTerms, setRepaymentTerms] = useState<string>('5');
    const [customInstallment, setCustomInstallment] = useState<string>('');
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

    // Live calculation for installment preview
    const installmentSummary = useMemo(() => {
        const numAmount = parseFloat(amount);
        if (!numAmount || isNaN(numAmount) || numAmount <= 0) return null;

        if (repaymentTermType === 'full') {
            return {
                perPayroll: numAmount,
                cutoffs: 1,
                label: `Full deduction on next payroll (₱${numAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`,
            };
        }

        if (repaymentTermType === 'months') {
            const m = parseInt(repaymentTerms, 10);
            if (!m || m <= 0) return null;
            const cutoffs = m * 2; // semi-monthly cutoffs
            const perPayroll = roundToTwo(numAmount / cutoffs);
            return {
                perPayroll,
                cutoffs,
                label: `${m} Months (${cutoffs} Semi-Monthly Cutoffs) • ₱${perPayroll.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} per payroll cutoff`,
            };
        }

        if (repaymentTermType === 'payrolls') {
            const cutoffs = parseInt(repaymentTerms, 10);
            if (!cutoffs || cutoffs <= 0) return null;
            const perPayroll = roundToTwo(numAmount / cutoffs);
            return {
                perPayroll,
                cutoffs,
                label: `${cutoffs} Payroll Cutoffs • ₱${perPayroll.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} per payroll cutoff`,
            };
        }

        if (repaymentTermType === 'fixed_amount') {
            const fixed = parseFloat(customInstallment);
            if (!fixed || fixed <= 0) return null;
            const estCutoffs = Math.ceil(numAmount / fixed);
            return {
                perPayroll: fixed,
                cutoffs: estCutoffs,
                label: `Fixed ₱${fixed.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / payroll (~${estCutoffs} payroll cutoffs)`,
            };
        }

        return null;
    }, [amount, repaymentTermType, repaymentTerms, customInstallment]);

    function roundToTwo(num: number): number {
        return Math.round((num + Number.EPSILON) * 100) / 100;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!employeeId || !amount || !advancementDate) {
            alert('Please fill out all required fields.');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload: any = {
                employee_id: parseInt(employeeId, 10),
                amount: parseFloat(amount),
                advancement_date: advancementDate,
                repayment_term_type: repaymentTermType,
                notes,
            };

            if (['months', 'payrolls'].includes(repaymentTermType)) {
                payload.repayment_terms = parseInt(repaymentTerms, 10) || 1;
            } else if (repaymentTermType === 'fixed_amount') {
                payload.installment_amount = parseFloat(customInstallment) || parseFloat(amount);
            }

            const res = await axios.post('/advancements', payload);

            if (res.data.success) {
                alert(res.data.message || 'Cash Advancement granted successfully!');
                onClose();
                if (onSuccess) onSuccess();
                // Reset form
                setAmount('');
                setNotes('');
                setRepaymentTermType('full');
                setRepaymentTerms('5');
                setCustomInstallment('');
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
                            Rule: Date-Matched Payout & Flexible Repayment Plan
                        </div>
                        <p className="text-muted-foreground leading-relaxed">
                            This cash advance will be added to the payroll matching{' '}
                            <strong>Advancement Date</strong>. Repayments will deduct across payrolls based on your selected plan.
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
                                placeholder="e.g. 5000.00"
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

                    {/* Repayment Plan Setup */}
                    <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-3">
                        <div className="space-y-1">
                            <Label htmlFor="adv_plan_type" className="text-xs font-semibold text-foreground">
                                Payment Plan / Repayment Schedule *
                            </Label>
                            <select
                                id="adv_plan_type"
                                value={repaymentTermType}
                                onChange={(e: any) => setRepaymentTermType(e.target.value)}
                                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                            >
                                <option value="full">Full Amount on Next Payroll (1 Cutoff)</option>
                                <option value="months">Distribute by Months (Semi-Monthly Cutoffs)</option>
                                <option value="payrolls">Distribute by Number of Payroll Cutoffs</option>
                                <option value="fixed_amount">Fixed Amount per Payroll Cutoff</option>
                            </select>
                        </div>

                        {repaymentTermType === 'months' && (
                            <div className="space-y-1">
                                <Label htmlFor="adv_months" className="text-xs font-semibold">
                                    Number of Months *
                                </Label>
                                <Input
                                    id="adv_months"
                                    type="number"
                                    min="1"
                                    max="48"
                                    placeholder="e.g. 5"
                                    value={repaymentTerms}
                                    onChange={(e) => setRepaymentTerms(e.target.value)}
                                    required
                                />
                            </div>
                        )}

                        {repaymentTermType === 'payrolls' && (
                            <div className="space-y-1">
                                <Label htmlFor="adv_payrolls" className="text-xs font-semibold">
                                    Number of Payroll Cutoffs *
                                </Label>
                                <Input
                                    id="adv_payrolls"
                                    type="number"
                                    min="1"
                                    max="96"
                                    placeholder="e.g. 10"
                                    value={repaymentTerms}
                                    onChange={(e) => setRepaymentTerms(e.target.value)}
                                    required
                                />
                            </div>
                        )}

                        {repaymentTermType === 'fixed_amount' && (
                            <div className="space-y-1">
                                <Label htmlFor="adv_custom_inst" className="text-xs font-semibold">
                                    Deduction Amount per Payroll (₱) *
                                </Label>
                                <Input
                                    id="adv_custom_inst"
                                    type="number"
                                    step="0.01"
                                    min="1"
                                    placeholder="e.g. 500.00"
                                    value={customInstallment}
                                    onChange={(e) => setCustomInstallment(e.target.value)}
                                    required
                                />
                            </div>
                        )}

                        {installmentSummary && (
                            <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded p-2">
                                💡 Breakdown: {installmentSummary.label}
                            </div>
                        )}
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
