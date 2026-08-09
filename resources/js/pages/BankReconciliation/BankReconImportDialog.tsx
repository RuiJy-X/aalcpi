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
import {
    registerJobPoll,
    markJobModalShown,
    unregisterJobPoll,
} from '@/lib/import-poll-tracker';


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
    const [step, setStep] = useState<1 | 2 | 3 | 'mapping'>(1);
    const [isImporting, setIsImporting] = useState(false);
    const [isPreviewing, setIsPreviewing] = useState(false);
    const [isSavingMapping, setIsSavingMapping] = useState(false);

    const currentDate = new Date();
    const currentYearStr = currentDate.getFullYear().toString();
    const currentMonthStr = String(currentDate.getMonth() + 1).padStart(2, '0');

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [importType, setImportType] = useState<'internal' | 'bank'>('internal');
    const [dateIssued, setDateIssued] = useState<string>('');
    const [disbursementWeek, setDisbursementWeek] = useState<string>('');
    const [bankMonth, setBankMonth] = useState<string>(`${currentYearStr}-${currentMonthStr}`);
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
        setDisbursementWeek('');
        setBankMonth(`${currentYearStr}-${currentMonthStr}`);
        setError(null);
        setStep(1);
        setHeaders([]);
        setSignature('');
        setMapping({});
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        setSelectedFile(e.target.files?.[0] ?? null);
        setError(null);
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
                setStep(2);
                return;
            }
            if (!disbursementWeek) {
                setError('Please select the week number for this batch.');
                setStep(2);
                return;
            }
        } else {
            if (!bankMonth) {
                setError('Please select the year and month for this batch.');
                setStep(2);
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
        if (!registerJobPoll(jobId)) {
            return;
        }

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
                        markJobModalShown(jobId);
                        setSummaryData(data);
                        setIsSummaryOpen(true);
                    }
                }
            } catch (err) {
                console.error(err);
                unregisterJobPoll(jobId);
            }

            if (attempts >= maxAttempts) {
                clearInterval(interval);
                unregisterJobPoll(jobId);
            }
        }, 1000);
    };

    const submitImport = (mappingId?: number) => {
        if (!selectedFile) {
            setError('Please select a file to import.');
            return;
        }

        const computedBankDate = `${bankMonth}-01`;

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
                          bank_date: computedBankDate,
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

    const getDialogHeader = () => {
        switch (step) {
            case 1:
                return {
                    title: 'Import Reconciliation Ledger - Step 1 of 3',
                    description: 'Select whether you want to import internal ledgers or a bank statement.',
                };
            case 2:
                return {
                    title: 'Import Reconciliation Ledger - Step 2 of 3',
                    description: importType === 'internal'
                        ? 'Specify the date issued and week number for the internal ledgers.'
                        : 'Specify the year and month for the bank statement.',
                };
            case 3:
                return {
                    title: 'Import Reconciliation Ledger - Step 3 of 3',
                    description: 'Choose the spreadsheet file (.xlsx, .xls, .csv) to import.',
                };
            case 'mapping':
                return {
                    title: 'Map Column Headers',
                    description: 'Match the columns in your spreadsheet file to system target fields.',
                };
        }
    };

    const headerInfo = getDialogHeader();

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
                    <DialogTitle>{headerInfo.title}</DialogTitle>
                    <DialogDescription>{headerInfo.description}</DialogDescription>
                </DialogHeader>

                {/* Progress Tracker */}
                <div className="mb-2 flex items-center justify-between border-b pb-3 text-xs pt-1">
                    <div
                        className={`flex items-center gap-1.5 font-medium ${
                            step === 1 ? 'text-primary' : 'text-muted-foreground'
                        }`}
                    >
                        <span
                            className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                                step === 1
                                    ? 'bg-primary text-primary-foreground'
                                    : typeof step === 'number' && step > 1
                                    ? 'bg-primary/20 text-primary'
                                    : 'bg-muted text-muted-foreground'
                            }`}
                        >
                            1
                        </span>
                        <span>Source</span>
                    </div>
                    <div className="h-[1px] flex-1 bg-border mx-2" />
                    <div
                        className={`flex items-center gap-1.5 font-medium ${
                            step === 2 ? 'text-primary' : 'text-muted-foreground'
                        }`}
                    >
                        <span
                            className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                                step === 2
                                    ? 'bg-primary text-primary-foreground'
                                    : typeof step === 'number' && step > 2
                                    ? 'bg-primary/20 text-primary'
                                    : 'bg-muted text-muted-foreground'
                            }`}
                        >
                            2
                        </span>
                        <span>Details</span>
                    </div>
                    <div className="h-[1px] flex-1 bg-border mx-2" />
                    <div
                        className={`flex items-center gap-1.5 font-medium ${
                            step === 3 ? 'text-primary' : 'text-muted-foreground'
                        }`}
                    >
                        <span
                            className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                                step === 3
                                    ? 'bg-primary text-primary-foreground'
                                    : step === 'mapping'
                                    ? 'bg-primary/20 text-primary'
                                    : 'bg-muted text-muted-foreground'
                            }`}
                        >
                            3
                        </span>
                        <span>File</span>
                    </div>
                    <div className="h-[1px] flex-1 bg-border mx-2" />
                    <div
                        className={`flex items-center gap-1.5 font-medium ${
                            step === 'mapping' ? 'text-primary' : 'text-muted-foreground'
                        }`}
                    >
                        <span
                            className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                                step === 'mapping'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted text-muted-foreground'
                            }`}
                        >
                            4
                        </span>
                        <span>Mapping</span>
                    </div>
                </div>

                {/* Step 1: Import Type Selection */}
                {step === 1 && (
                    <div className="space-y-6 pt-2">
                        <div className="space-y-2">
                            <Label>Select Import Source</Label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setImportType('internal');
                                        setError(null);
                                    }}
                                    className={`flex flex-col items-center justify-center rounded-xl border-2 p-4 text-center transition-all ${
                                        importType === 'internal'
                                            ? 'border-primary bg-primary/5 text-primary'
                                            : 'border-muted bg-transparent text-muted-foreground hover:bg-accent/50'
                                    }`}
                                >
                                    <Building2 className="mb-2 h-6 w-6" />
                                    <span className="text-sm font-semibold">
                                        Internal Ledgers
                                    </span>
                                    <span className="mt-0.5 text-xs text-muted-foreground">
                                        Company Books
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setImportType('bank');
                                        setError(null);
                                    }}
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
                                <Button type="button" variant="outline">
                                    Cancel
                                </Button>
                            </DialogClose>
                            <Button
                                type="button"
                                onClick={() => {
                                    setError(null);
                                    setStep(2);
                                }}
                            >
                                Next: Enter Details
                            </Button>
                        </DialogFooter>
                    </div>
                )}

                {/* Step 2: Batch Metadata Details */}
                {step === 2 && (
                    <div className="space-y-6 pt-2">
                        {importType === 'internal' ? (
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
                                        max="53"
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
                        ) : (
                            <div className="space-y-2">
                                <Label htmlFor="bank-month">Month and Year</Label>
                                <Input
                                    type="month"
                                    id="bank-month"
                                    value={bankMonth}
                                    onChange={(e) => {
                                        setBankMonth(e.target.value);
                                        setError(null);
                                    }}
                                    disabled={isImporting || isPreviewing}
                                />
                            </div>
                        )}

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
                                onClick={() => {
                                    setError(null);
                                    setStep(1);
                                }}
                            >
                                Back
                            </Button>
                            <Button
                                type="button"
                                onClick={() => {
                                    if (importType === 'internal') {
                                        if (!dateIssued) {
                                            setError('Please select the date issued for this batch.');
                                            return;
                                        }
                                        if (!disbursementWeek) {
                                            setError('Please select the week number for this batch.');
                                            return;
                                        }
                                    } else {
                                        if (!bankMonth) {
                                            setError('Please select the year and month for this batch.');
                                            return;
                                        }
                                    }
                                    setError(null);
                                    setStep(3);
                                }}
                            >
                                Next: Select File
                            </Button>
                        </DialogFooter>
                    </div>
                )}

                {/* Step 3: File Attachment */}
                {step === 3 && (
                    <form onSubmit={handleNextOrPreview} className="space-y-6 pt-2">
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
                            {selectedFile && (
                                <p className="text-xs text-muted-foreground font-medium pt-1">
                                    Selected file: <span className="text-foreground">{selectedFile.name}</span> ({Math.round(selectedFile.size / 1024)} KB)
                                </p>
                            )}
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
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setError(null);
                                    setStep(2);
                                }}
                                disabled={isImporting || isPreviewing}
                            >
                                Back
                            </Button>
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
                )}

                {/* Step 4: Column Mapping */}
                {step === 'mapping' && (
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
                                onClick={() => {
                                    setError(null);
                                    setStep(3);
                                }}
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