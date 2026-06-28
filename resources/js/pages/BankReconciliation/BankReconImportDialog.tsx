import React, { useState, type ChangeEvent, useMemo } from 'react';
import { router } from '@inertiajs/react';
import { Import, FileSpreadsheet, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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
import { set } from 'date-fns';

const WEEK_OPTIONS = [1, 2, 3, 4, 5] as const;

export function BankReconImportDialog() {
    const [isOpen, setIsOpen] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [importType, setImportType] = useState<'internal' | 'bank'>('internal');
    const [dateIssued, setDateIssued] = useState<string>('');
    const [bankDate, setBankDate] = useState<string>('');
    const [disbursementWeek, setDisbursementWeek] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    const resetDialog = () => {
        setSelectedFile(null);
        setImportType('internal');
        setDateIssued('');
        setBankDate('');
        setDisbursementWeek('');
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

        if (importType === 'internal') {
            if (!dateIssued) {
                setError('Please select the date issued for this batch.');
                return;
            }
            if (!disbursementWeek) {
                setError('Please select the disbursement week for this batch.');
                return;
            }
        } else {
            if (!bankDate) {
                setError('Please select the bank date for this batch.');
                return;
            }
        }

        router.post(
            importRoute.url(),
            {
                file: selectedFile,
                type: importType, // Sends 'internal' or 'bank' to your controller
                ...(importType === 'internal'
                    ? {
                          date_issued: dateIssued,
                          disbursement_week: disbursementWeek,
                      }
                    : {
                          bank_date: bankDate,
                      }),
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
                    setError(
                        errors.file ||
                            errors.type ||
                            errors.date_issued ||
                            errors.disbursement_week ||
                            errors.bank_date ||
                            'Something went wrong during the import.',
                    );
                },
            },
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
                        Upload your business logs or bank statement spreadsheets
                        to begin automated matching.
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
                                        : 'border-muted bg-transparent text-muted-foreground hover:bg-accent/50'
                                }`}
                            >
                                <Building2 className="mb-2 h-6 w-6" />
                                <span className="text-sm font-semibold">
                                    Internal Ledger
                                </span>
                                <span className="mt-0.5 text-xs text-muted-foreground">
                                    Company Books
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setImportType('bank')}
                                className={`flex flex-col items-center justify-center rounded-xl border-2 p-4 text-center transition-all ${
                                    importType === 'bank'
                                        ? 'border-primary bg-primary/5 text-primary'
                                        : 'border-muted bg-transparent text-muted-foreground hover:bg-accent/50'
                                }`}
                            >
                                <FileSpreadsheet className="mb-2 h-6 w-6" />
                                <span className="text-sm font-semibold">
                                    Bank Statement
                                </span>
                                <span className="mt-0.5 text-xs text-muted-foreground">
                                    Raw Bank Exports
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Batch metadata — only relevant for internal ledger imports */}
                    {importType === 'internal' && (
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label htmlFor="date-issued">Date Issued</Label>
                                <Input
                                    type="date"
                                    id="date-issued"
                                    value={dateIssued}
                                    onChange={(e) => {
                                        setDateIssued(e.target.value);
                                        setError(null);
                                    }}
                                    disabled={isImporting}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="disbursement-week">Week</Label>
                                <Select
                                    value={disbursementWeek}
                                    onValueChange={(value) => {
                                        setDisbursementWeek(value);
                                        setError(null);
                                    }}
                                    disabled={isImporting}
                                >
                                    <SelectTrigger id="disbursement-week">
                                        <SelectValue placeholder="Select week" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {WEEK_OPTIONS.map((week) => (
                                            <SelectItem
                                                key={week}
                                                value={String(week)}
                                            >
                                                Week {week}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}

                    {importType === 'bank' && (
                        <div className="grid grid-cols-1">
                            <div className="space-y-2">
                                <Label htmlFor="bank-date">Date</Label>
                                <Input
                                    type="date"
                                    id="bank-date"
                                    value={bankDate}
                                    placeholder="Select Month and Year"
                                    onChange={(e) => {
                                        setBankDate(e.target.value);
                                        setError(null);
                                    }}
                                    disabled={isImporting}
                                />
                            </div>
                        </div>
                    )}

                    {/* File Attachment Input Wrapper */}
                    <div className="space-y-2">
                        <Label htmlFor="recon-file">
                            Spreadsheet Attachment
                        </Label>
                        <Input
                            type="file"
                            id="recon-file"
                            accept=".xlsx,.xls,.csv"
                            onChange={handleFileChange}
                            disabled={isImporting}
                            className="cursor-pointer file:text-primary"
                        />
                        <p className="text-[11px] text-muted-foreground">
                            Supported extensions:{' '}
                            <code className="rounded bg-muted px-1 py-0.5">
                                .xlsx
                            </code>
                            ,{' '}
                            <code className="rounded bg-muted px-1 py-0.5">
                                .xls
                            </code>
                            ,{' '}
                            <code className="rounded bg-muted px-1 py-0.5">
                                .csv
                            </code>
                        </p>
                    </div>

                    {error && (
                        <p
                            className="rounded-lg bg-destructive/10 p-2.5 text-xs font-medium text-destructive"
                            role="alert"
                        >
                            {error}
                        </p>
                    )}

                    <DialogFooter className="gap-2 sm:gap-0">
                        <DialogClose asChild>
                            <Button
                                type="button"
                                variant="outline"
                                disabled={isImporting}
                            >
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button
                            type="submit"
                            disabled={isImporting || !selectedFile}
                        >
                            {isImporting
                                ? 'Processing Sheets...'
                                : 'Run Importer'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}