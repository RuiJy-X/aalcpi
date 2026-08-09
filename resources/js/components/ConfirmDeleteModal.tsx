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
import { Trash2, AlertTriangle } from 'lucide-react';

export type ConfirmDeleteModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    description?: string;
    isProcessing?: boolean;
};

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title = 'Delete Payroll Record',
    description = 'Are you sure you want to delete this draft payroll record? Any associated cash advance deductions will be safely reverted.',
    isProcessing = false,
}) => {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-md p-6">
                <DialogHeader className="flex flex-col items-center text-center space-y-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950/80 dark:text-rose-400 ring-8 ring-rose-50 dark:ring-rose-950/40">
                        <Trash2 className="h-6 w-6" />
                    </div>
                    <DialogTitle className="text-lg font-bold text-foreground">
                        {title}
                    </DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
                        {description}
                    </DialogDescription>
                </DialogHeader>

                <div className="my-2 rounded-lg border border-rose-200 bg-rose-50/70 p-3.5 dark:border-rose-900/50 dark:bg-rose-950/30">
                    <div className="flex gap-2.5">
                        <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-rose-800 dark:text-rose-300 font-medium">
                            This action cannot be undone once confirmed.
                        </p>
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
                        variant="destructive"
                        onClick={onConfirm}
                        disabled={isProcessing}
                        className="w-full sm:w-auto font-bold shadow-xs"
                    >
                        <Trash2 className="mr-1.5 h-4 w-4" />
                        {isProcessing ? 'Deleting...' : 'Delete Record'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
