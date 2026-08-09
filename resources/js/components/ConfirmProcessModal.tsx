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
import { Calculator, CheckCircle2 } from 'lucide-react';

export type ConfirmProcessModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    description?: string;
    isProcessing?: boolean;
};

export const ConfirmProcessModal: React.FC<ConfirmProcessModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title = 'Process Payroll Draft',
    description = 'Are you sure you want to process and generate draft payroll records for the selected period?',
    isProcessing = false,
}) => {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-md p-6">
                <DialogHeader className="flex flex-col items-center text-center space-y-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-950/80 dark:text-blue-400 ring-8 ring-blue-50 dark:ring-blue-950/40">
                        <Calculator className="h-6 w-6" />
                    </div>
                    <DialogTitle className="text-lg font-bold text-foreground">
                        {title}
                    </DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
                        {description}
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-3">
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
                        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs"
                    >
                        <CheckCircle2 className="mr-1.5 h-4 w-4" />
                        {isProcessing ? 'Processing...' : 'Confirm & Process'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
