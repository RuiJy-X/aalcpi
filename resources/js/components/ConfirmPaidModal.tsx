import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { HandCoins, AlertTriangle, ShieldCheck } from 'lucide-react';

export type ConfirmPaidModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    employeeName?: string | null;
    payrollId?: number;
    isProcessing?: boolean;
};

export const ConfirmPaidModal: React.FC<ConfirmPaidModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    employeeName,
    payrollId,
    isProcessing = false,
}) => {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-md p-6">
                <DialogHeader className="flex flex-col items-center text-center space-y-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-400 ring-8 ring-emerald-50 dark:ring-emerald-950/40">
                        <HandCoins className="h-6 w-6" />
                    </div>
                    <DialogTitle className="text-lg font-bold text-foreground">
                        Confirm Payroll Finalization
                    </DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
                        Are you sure you intend to mark the payroll for{' '}
                        <span className="font-semibold text-foreground">
                            {employeeName || (payrollId ? `Payroll #${payrollId}` : 'this employee')}
                        </span>{' '}
                        as <span className="font-bold text-emerald-600 dark:text-emerald-400 uppercase">PAID</span>?
                    </DialogDescription>
                </DialogHeader>

                <div className="my-2 rounded-lg border border-amber-200 bg-amber-50/70 p-3.5 dark:border-amber-900/50 dark:bg-amber-950/30">
                    <div className="flex gap-2.5">
                        <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div className="text-xs text-amber-800 dark:text-amber-300 space-y-1">
                            <p className="font-bold">Important Financial Commitment:</p>
                            <ul className="list-disc pl-3.5 space-y-0.5 text-[11px] text-amber-700 dark:text-amber-400">
                                <li>Cash advance repayment deductions will be permanently committed to the ledger.</li>
                                <li>Once marked as paid, this payroll record is finalized and cannot be reverted back to draft.</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={isProcessing}
                        className="w-full sm:w-auto"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={onConfirm}
                        disabled={isProcessing}
                        className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm"
                    >
                        <ShieldCheck className="mr-1.5 h-4 w-4" />
                        {isProcessing ? 'Finalizing...' : 'Yes, Mark as Paid'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
