import React, { useState, type ChangeEvent, useMemo } from 'react';
import { router } from '@inertiajs/react';
import { Import, FileSpreadsheet, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { importMethod as importRoute } from '@/routes/bank-reconciliation-import';

export function BankReconImportDialog() {
    const [isOpen, setIsOpen] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [importType, setImportType] = useState<'internal' | 'bank'>('internal');
    const [error, setError] = useState<string | null>(null);

    const resetDialog = () => {
        setSelectedFile(null);
        setImportType('internal');
        setError(null);
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        setSelectedFile(e.target.files?.[0] ?? null);
        setError(null);
    };

    const handleImportSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFile) {
            setError('Please select a file to import.');
            return;
        }

        router.post(
            importRoute.url(),
            {
                file: selectedFile,
                type: importType, // Sends 'internal' or 'bank' to your controller
            },
            {
                forceFormData: true,
                preserveScroll: true,
                onStart: () => setIsImporting(true),
                onFinish: () => setIsImporting(false),
                onSuccess: () => {
                    resetDialog();
                    setIsOpen(false);
                },
                onError: (errors) => {
                    setError(errors.file || errors.type || 'Something went wrong during the import.');
                },
            }
        );
    };

    return (
        <Dialog
            open={isOpen}
            onOpenChange={(open) => {
                setIsOpen(open);
                if (!open) resetDialog();
            }}
        >
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Import className="h-4 w-4" />
                    Import Datasets
                </Button>
            </DialogTrigger>
            
            <DialogContent className="bg-card sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Import Reconciliation Ledger</DialogTitle>
                    <DialogDescription>
                        Upload your business logs or bank statement spreadsheets to begin automated matching.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleImportSubmit} className="space-y-6 pt-2">
                    {/* Source Selector Cards */}
                    <div className="space-y-2">
                        <Label>Data Source Location</Label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setImportType('internal')}
                                className={`flex flex-col items-center justify-center rounded-xl border-2 p-4 text-center transition-all ${
                                    importType === 'internal'
                                        ? 'border-primary bg-primary/5 text-primary'
                                        : 'border-muted bg-transparent hover:bg-accent/50 text-muted-foreground'
                                }`}
                            >
                                <Building2 className="mb-2 h-6 w-6" />
                                <span className="text-sm font-semibold">Internal Ledger</span>
                                <span className="text-xs text-muted-foreground mt-0.5">Company Books</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setImportType('bank')}
                                className={`flex flex-col items-center justify-center rounded-xl border-2 p-4 text-center transition-all ${
                                    importType === 'bank'
                                        ? 'border-primary bg-primary/5 text-primary'
                                        : 'border-muted bg-transparent hover:bg-accent/50 text-muted-foreground'
                                }`}
                            >
                                <FileSpreadsheet className="mb-2 h-6 w-6" />
                                <span className="text-sm font-semibold">Bank Statement</span>
                                <span className="text-xs text-muted-foreground mt-0.5">Raw Bank Exports</span>
                            </button>
                        </div>
                    </div>

                    {/* File Attachment Input Wrapper */}
                    <div className="space-y-2">
                        <Label htmlFor="recon-file">Spreadsheet Attachment</Label>
                        <Input
                            type="file"
                            id="recon-file"
                            accept=".xlsx,.xls,.csv"
                            onChange={handleFileChange}
                            disabled={isImporting}
                            className="cursor-pointer file:text-primary"
                        />
                        <p className="text-[11px] text-muted-foreground">
                            Supported extensions: <code className="bg-muted px-1 py-0.5 rounded">.xlsx</code>, <code className="bg-muted px-1 py-0.5 rounded">.xls</code>, <code className="bg-muted px-1 py-0.5 rounded">.csv</code>
                        </p>
                    </div>

                    {error && (
                        <p className="text-xs font-medium text-destructive bg-destructive/10 p-2.5 rounded-lg" role="alert">
                            {error}
                        </p>
                    )}

                    <DialogFooter className="gap-2 sm:gap-0">
                        <DialogClose asChild>
                            <Button type="button" variant="outline" disabled={isImporting}>
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button type="submit" disabled={isImporting || !selectedFile}>
                            {isImporting ? 'Processing Sheets...' : 'Run Importer'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}