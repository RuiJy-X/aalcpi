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
import {
    bankReconInternalTargets,
    bankReconBankTargets,
    type ImportTarget,
} from '@/components/import/import-config';
import { ImportSummaryModal, type ImportSummaryData } from '@/components/import/import-summary-modal';


type MappingPreviewResponse = {
    headers: string[];
    signature: string;
    mapping?: Record<string, string>;
    mapping_id?: number;
};

const getCsrfToken = (): string => {
    const token = document
        .querySelector('meta[name="csrf-token"]')
        ?.getAttribute('content');
    return token ?? '';
};

const formatErrorDetails = (data: unknown, fallbackMessage: string): string => {
    if (!data || typeof data !== 'object') {
        return fallbackMessage;
    }
    const detail = JSON.stringify(data);
    return detail ? `${fallbackMessage} ${detail}` : fallbackMessage;
};

const postFormData = async <T,>(
    url: string,
    formData: FormData,
): Promise<T> => {
    const response = await fetch(url, {
        method: 'POST',
        body: formData,
        headers: {
            Accept: 'application/json',
            'X-CSRF-TOKEN': getCsrfToken(),
            'X-Requested-With': 'XMLHttpRequest',
        },
    });

    if (!response.ok) {
        let data: unknown = null;
        try {
            data = await response.json();
        } catch {
            data = null;
        }

        const errorMessage = formatErrorDetails(
            data,
            `HTTP ${response.status}`,
        );
        throw new Error(errorMessage);
    }

    return response.json() as Promise<T>;
};

const postJson = async <T,>(
    url: string,
    payload: Record<string, unknown>,
): Promise<T> => {
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': getCsrfToken(),
            'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify(payload),
    });

    const data = (await response.json()) as {
        message?: string;
        errors?: Record<string, string | string[]>;
    };

    if (!response.ok) {
        let errorMsg = formatErrorDetails(data, `HTTP ${response.status}`);
        if (data.message) {
            errorMsg = `${data.message} ${JSON.stringify(data)}`.trim();
        }
        throw new Error(errorMsg);
    }

    return data as T;
};

export function BankReconImportDialog() {
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState<'select' | 'mapping'>('select');
    const [isImporting, setIsImporting] = useState(false);
    const [isPreviewing, setIsPreviewing] = useState(false);
    const [isSavingMapping, setIsSavingMapping] = useState(false);

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [importType, setImportType] = useState<'internal' | 'bank'>('internal');
    const [dateIssued, setDateIssued] = useState<string>('');
    const [bankDate, setBankDate] = useState<string>('');
    const [disbursementWeek, setDisbursementWeek] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    const [headers, setHeaders] = useState<string[]>([]);
    const [signature, setSignature] = useState<string>('');
    const [mapping, setMapping] = useState<Record<string, string>>({});

    const currentMappingTargets = useMemo<ImportTarget[]>(() => {
        return importType === 'internal'
            ? bankReconInternalTargets
            : bankReconBankTargets;
    }, [importType]);

    const mappingType = useMemo(() => {
        return importType === 'internal'
            ? 'bank_recon_internal'
            : 'bank_recon_bank';
    }, [importType]);

    const requiredMissing = useMemo(() => {
        return currentMappingTargets.filter(
            (target) => target.required && !mapping[target.key],
        );
    }, [currentMappingTargets, mapping]);

    const resetDialog = () => {
        setSelectedFile(null);
        setImportType('internal');
        setDateIssued('');
        setBankDate('');
        setDisbursementWeek('');
        setError(null);
        setStep('select');
        setHeaders([]);
        setSignature('');
        setMapping({});
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        setSelectedFile(e.target.files?.[0] ?? null);
        setError(null);
        setStep('select');
    };

    const handleNextOrPreview = async (e: React.FormEvent) => {
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

        setIsPreviewing(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('import_type', mappingType);

            const preview = await postFormData<MappingPreviewResponse>(
                '/Imports/preview',
                formData,
            );

            const nextHeaders = (preview.headers ?? []).filter(
                (header) => header.trim() !== '',
            );
            const nextMapping = currentMappingTargets.reduce(
                (acc, target) => {
                    acc[target.key] = nextHeaders.includes(target.key)
                        ? target.key
                        : '';
                    return acc;
                },
                {} as Record<string, string>,
            );

            const existingMapping = preview.mapping ?? {};
            Object.keys(nextMapping).forEach((key) => {
                if (existingMapping[key]) {
                    nextMapping[key] = existingMapping[key];
                }
            });

            setHeaders(nextHeaders);
            setSignature(preview.signature ?? '');
            setMapping(nextMapping);
            setStep('mapping');
        } catch (err) {
            const error = err as Error;
            setError(
                `Failed to read the file headers: ${error.message || 'Unknown error'}`,
            );
        } finally {
            setIsPreviewing(false);
        }
    };

    const [summaryData, setSummaryData] = useState<ImportSummaryData | null>(null);
    const [isSummaryOpen, setIsSummaryOpen] = useState(false);

    const pollSummary = (jobId: number) => {
        let attempts = 0;
        const maxAttempts = 60;

        const interval = setInterval(async () => {
            attempts++;
            try {
                const res = await fetch(`/Imports/status/${jobId}`, {
                    headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                });
                if (res.ok) {
                    const data: ImportSummaryData = await res.json();
                    if (data.status === 'done' || data.status === 'failed') {
                        clearInterval(interval);
                        setSummaryData(data);
                        setIsSummaryOpen(true);
                    }
                }
            } catch (err) {
                console.error(err);
            }

            if (attempts >= maxAttempts) {
                clearInterval(interval);
            }
        }, 1000);
    };

    const submitImport = (mappingId?: number) => {
        if (!selectedFile) {
            setError('Please select a file to import.');
            return;
        }

        router.post(
            importRoute.url(),
            {
                file: selectedFile,
                type: importType,
                ...(importType === 'internal'
                    ? {
                          date_issued: dateIssued,
                          disbursement_week: disbursementWeek,
                      }
                    : {
                          bank_date: bankDate,
                      }),
                ...(mappingId ? { mapping_id: mappingId } : {}),
            },
            {
                forceFormData: true,
                preserveScroll: true,
                onStart: () => setIsImporting(true),
                onFinish: () => setIsImporting(false),
                onSuccess: (page) => {
                    const jobId = (page.props as Record<string, unknown>).import_job_id ||
                        ((page.props as Record<string, unknown>).flash as Record<string, unknown>)?.import_job_id;
                    resetDialog();
                    setIsOpen(false);
                    if (jobId && typeof jobId === 'number') {
                        pollSummary(jobId);
                    }
                },
                onError: (errors) => {
                    setError(
                        errors.file ||
                            errors.type ||
                            errors.date_issued ||
                            errors.disbursement_week ||
                            errors.bank_date ||
                            errors.mapping_id ||
                            'Something went wrong during the import.',
                    );
                },
            },
        );
    };

    const handleSaveMappingAndImport = async () => {
        if (!selectedFile) return;

        if (!signature) {
            setError('Missing header signature.');
            return;
        }

        setIsSavingMapping(true);
        setError(null);

        try {
            const response = await postJson<{ mapping_id: number }>(
                '/Imports/mappings',
                {
                    import_type: mappingType,
                    header_signature: signature,
                    headers,
                    mapping,
                },
            );

            submitImport(response.mapping_id);
        } catch (err) {
            const error = err as Error;
            setError(
                `Failed to save the mapping: ${error.message || 'Unknown error'}`,
            );
        } finally {
            setIsSavingMapping(false);
        }
    };

    return (
        <>
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

            <DialogContent className="bg-card sm:max-w-md max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {step === 'mapping'
                            ? 'Map Column Headers'
                            : 'Import Reconciliation Ledger'}
                    </DialogTitle>
                    <DialogDescription>
                        {step === 'mapping'
                            ? 'Match the columns in your spreadsheet file to system target fields.'
                            : 'Upload your business logs or bank statement spreadsheets to begin automated matching.'}
                    </DialogDescription>
                </DialogHeader>

                {step === 'select' ? (
                    <form onSubmit={handleNextOrPreview} className="space-y-6 pt-2">
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
                                        disabled={isImporting || isPreviewing}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="disbursement-week">Week Number</Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        id="disbursement-week"
                                        placeholder="e.g. 1, 2, 12, 52..."
                                        value={disbursementWeek}
                                        onChange={(e) => {
                                            setDisbursementWeek(e.target.value);
                                            setError(null);
                                        }}
                                        disabled={isImporting || isPreviewing}
                                    />
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
                                        disabled={isImporting || isPreviewing}
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
                                disabled={isImporting || isPreviewing}
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
                                    disabled={isImporting || isPreviewing}
                                >
                                    Cancel
                                </Button>
                            </DialogClose>
                            <Button
                                type="submit"
                                disabled={isImporting || isPreviewing || !selectedFile}
                            >
                                {isPreviewing
                                    ? 'Reading Headers...'
                                    : 'Next: Map Columns'}
                            </Button>
                        </DialogFooter>
                    </form>
                ) : (
                    <div className="space-y-4 pt-2">
                        <div className="rounded-md bg-muted p-3 text-xs leading-5">
                            <p className="font-medium text-foreground">
                                Detected Headers in File:
                            </p>
                            <p className="mt-1 break-words text-muted-foreground">
                                {headers.length
                                    ? headers.join(', ')
                                    : 'No headers detected.'}
                            </p>
                        </div>

                        {requiredMissing.length > 0 && (
                            <div className="rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-xs leading-5">
                                <p className="font-semibold text-amber-600 dark:text-amber-400">
                                    Unmapped Required Fields:
                                </p>
                                <p className="mt-1 text-amber-700 dark:text-amber-300">
                                    {requiredMissing
                                        .map((t) => t.label)
                                        .join(', ')}
                                </p>
                            </div>
                        )}

                        <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
                            {currentMappingTargets.map((target) => (
                                <div
                                    key={target.key}
                                    className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:items-center"
                                >
                                    <div className="text-sm font-medium">
                                        {target.label}
                                        {target.required && (
                                            <span className="ml-1 text-red-500">
                                                *
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        <Select
                                            value={
                                                mapping[target.key] ||
                                                '__none__'
                                            }
                                            onValueChange={(value) =>
                                                setMapping((prev) => ({
                                                    ...prev,
                                                    [target.key]:
                                                        value === '__none__'
                                                            ? ''
                                                            : value,
                                                }))
                                            }
                                        >
                                            <SelectTrigger id={target.key}>
                                                <SelectValue placeholder="Select a header" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="__none__">
                                                    <span className="text-red-500">
                                                        Not Mapped
                                                    </span>
                                                </SelectItem>
                                                {headers.map((header) => (
                                                    <SelectItem
                                                        key={header}
                                                        value={header}
                                                    >
                                                        {header}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            ))}
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
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setStep('select')}
                                disabled={isSavingMapping || isImporting}
                            >
                                Back
                            </Button>
                            <DialogClose asChild>
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={isSavingMapping || isImporting}
                                >
                                    Cancel
                                </Button>
                            </DialogClose>
                            <Button
                                type="button"
                                onClick={handleSaveMappingAndImport}
                                disabled={isSavingMapping || isImporting}
                            >
                                {isSavingMapping || isImporting
                                    ? 'Saving & Processing...'
                                    : 'Save & Run Importer'}
                            </Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
        <ImportSummaryModal
            isOpen={isSummaryOpen}
            onClose={() => setIsSummaryOpen(false)}
            summary={summaryData}
        />
        </>
    );
}